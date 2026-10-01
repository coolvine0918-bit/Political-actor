import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ConnectionMap } from '../types';
import { QUIZ_ITEMS, ACTOR_NODES, ROLE_NODES } from '../data/quizData';

interface ConnectionsSvgProps {
  connections: ConnectionMap;
  onRemoveConnection: (caseId: number, type: 'actor' | 'role') => void;
  showCorrectAnswers?: boolean;
  draggingState?: {
    fromDotId: string;
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
    color: string;
  } | null;
}

interface Point {
  x: number;
  y: number;
}

export const ConnectionsSvg: React.FC<ConnectionsSvgProps> = ({
  connections,
  onRemoveConnection,
  showCorrectAnswers = false,
  draggingState,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Record<string, Point>>({});

  const updatePositions = useCallback(() => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const newPos: Record<string, Point> = {};

    // 1. Case dots
    QUIZ_ITEMS.forEach((item) => {
      const el = document.getElementById(`case-dot-${item.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newPos[`case-dot-${item.id}`] = {
          x: rect.left + rect.width / 2 - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top,
        };
      }
    });

    // 2. Actor dots (left & right)
    ACTOR_NODES.forEach((actor) => {
      const leftEl = document.getElementById(`actor-dot-left-${actor.id}`);
      if (leftEl) {
        const rect = leftEl.getBoundingClientRect();
        newPos[`actor-dot-left-${actor.id}`] = {
          x: rect.left + rect.width / 2 - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top,
        };
      }
      const rightEl = document.getElementById(`actor-dot-right-${actor.id}`);
      if (rightEl) {
        const rect = rightEl.getBoundingClientRect();
        newPos[`actor-dot-right-${actor.id}`] = {
          x: rect.left + rect.width / 2 - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top,
        };
      }
    });

    // 3. Role dots
    ROLE_NODES.forEach((role) => {
      const el = document.getElementById(`role-dot-${role.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newPos[`role-dot-${role.id}`] = {
          x: rect.left + rect.width / 2 - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top,
        };
      }
    });

    setPositions(newPos);
  }, []);

  useEffect(() => {
    updatePositions();
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    const observer = new ResizeObserver(() => updatePositions());
    if (svgRef.current) {
      observer.observe(svgRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer.disconnect();
    };
  }, [updatePositions]);

  // Recalculate on connection changes
  useEffect(() => {
    const timer = setTimeout(updatePositions, 50);
    return () => clearTimeout(timer);
  }, [connections, showCorrectAnswers, updatePositions]);

  const renderBezier = (
    p1: Point,
    p2: Point,
    color: string,
    key: string,
    onDelete?: () => void,
    isDashed = false
  ) => {
    const dx = Math.max(Math.abs(p2.x - p1.x) * 0.45, 40);
    const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    return (
      <g key={key} className="group transition-all duration-200">
        {/* Transparent stroke for easy clicking to delete */}
        {onDelete && (
          <path
            d={pathD}
            fill="none"
            stroke="transparent"
            strokeWidth="24"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <title>클릭하여 연결선 삭제</title>
          </path>
        )}

        {/* Glow backdrop path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeOpacity="0.25"
          className="transition-all duration-200 group-hover:stroke-opacity-60"
        />

        {/* Main sharp line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={isDashed ? '3' : '3.5'}
          strokeDasharray={isDashed ? '6 4' : undefined}
          strokeLinecap="round"
          className="transition-all duration-200 group-hover:stroke-width-[5px]"
        />

        {/* Start and end mini indicators */}
        <circle cx={p1.x} cy={p1.y} r="4.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
        <circle cx={p2.x} cy={p2.y} r="4.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />

        {/* Hover delete pill */}
        {onDelete && (
          <g
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <circle cx={midX} cy={midY} r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <path
              d={`M ${midX - 4} ${midY - 4} L ${midX + 4} ${midY + 4} M ${midX + 4} ${midY - 4} L ${midX - 4} ${midY + 4}`}
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Render Student Connections */}
      {!showCorrectAnswers &&
        QUIZ_ITEMS.map((item) => {
          const conn = connections[item.id];
          if (!conn) return null;

          const elements: React.ReactNode[] = [];
          const casePt = positions[`case-dot-${item.id}`];

          // 1. Case -> Actor Line
          if (conn.actorNodeId && casePt) {
            const actorLeftPt = positions[`actor-dot-left-${conn.actorNodeId}`];
            if (actorLeftPt) {
              elements.push(
                renderBezier(
                  casePt,
                  actorLeftPt,
                  item.color,
                  `case-${item.id}-to-actor-${conn.actorNodeId}`,
                  () => onRemoveConnection(item.id, 'actor')
                )
              );
            }
          }

          // 2. Actor -> Role Line
          if (conn.actorNodeId && conn.roleNodeId) {
            const actorRightPt = positions[`actor-dot-right-${conn.actorNodeId}`];
            const rolePt = positions[`role-dot-${conn.roleNodeId}`];
            if (actorRightPt && rolePt) {
              elements.push(
                renderBezier(
                  actorRightPt,
                  rolePt,
                  item.color,
                  `actor-${conn.actorNodeId}-to-role-${conn.roleNodeId}`,
                  () => onRemoveConnection(item.id, 'role')
                )
              );
            }
          }

          return elements;
        })}

      {/* Render Correct Answer Guide Lines if toggled */}
      {showCorrectAnswers &&
        QUIZ_ITEMS.map((item) => {
          // Find matching actor
          const matchingActor = ACTOR_NODES.find(
            (a) =>
              a.text === item.actor &&
              (item.id === 3 ? a.id === 'actor-3' : item.id === 5 ? a.id === 'actor-5' : true)
          );
          // Find matching role
          const matchingRole = ROLE_NODES.find((r) => r.targetCaseId === item.id);

          const casePt = positions[`case-dot-${item.id}`];
          const elements: React.ReactNode[] = [];

          if (matchingActor && casePt) {
            const actorLeftPt = positions[`actor-dot-left-${matchingActor.id}`];
            const actorRightPt = positions[`actor-dot-right-${matchingActor.id}`];
            if (actorLeftPt) {
              elements.push(
                renderBezier(
                  casePt,
                  actorLeftPt,
                  item.color,
                  `correct-case-${item.id}`,
                  undefined,
                  false
                )
              );
            }
            if (matchingRole && actorRightPt) {
              const rolePt = positions[`role-dot-${matchingRole.id}`];
              if (rolePt) {
                elements.push(
                  renderBezier(
                    actorRightPt,
                    rolePt,
                    item.color,
                    `correct-role-${item.id}`,
                    undefined,
                    false
                  )
                );
              }
            }
          }
          return elements;
        })}

      {/* Dragging Rubberband Line */}
      {draggingState && (
        <g>
          <path
            d={`M ${draggingState.startPoint.x} ${draggingState.startPoint.y} Q ${
              (draggingState.startPoint.x + draggingState.currentPoint.x) / 2
            } ${
              (draggingState.startPoint.y + draggingState.currentPoint.y) / 2 + 10
            }, ${draggingState.currentPoint.x} ${draggingState.currentPoint.y}`}
            fill="none"
            stroke={draggingState.color}
            strokeWidth="3.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
          <circle
            cx={draggingState.currentPoint.x}
            cy={draggingState.currentPoint.y}
            r="6"
            fill={draggingState.color}
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  );
};
