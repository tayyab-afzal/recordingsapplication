"use client";

import { useState, useRef, useEffect } from "react";

export default function ResizableSidebar({
  children,
  side = "left",
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 600,
  onResize,
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const savedWidth = localStorage.getItem(`sidebar-${side}-width`);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
        if (onResize) onResize(parsedWidth);
      }
    }
  }, [side, minWidth, maxWidth, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";
    if (sidebarRef.current) {
      sidebarRef.current.style.pointerEvents = "auto";
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX =
        side === "left"
          ? e.clientX - startXRef.current
          : startXRef.current - e.clientX;

      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidthRef.current + deltaX)
      );

      setWidth(newWidth);
      if (onResize) onResize(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.body.style.pointerEvents = "";
        if (sidebarRef.current) {
          sidebarRef.current.style.pointerEvents = "";
        }
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, side, minWidth, maxWidth, onResize]);

  useEffect(() => {
    if (width >= minWidth && width <= maxWidth) {
      localStorage.setItem(`sidebar-${side}-width`, width.toString());
    }
  }, [width, side, minWidth, maxWidth]);

  return (
    <div
      ref={sidebarRef}
      className={`resizable-sidebar resizable-sidebar-${side} ${
        isResizing ? "resizing" : ""
      }`}
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`resize-handle resize-handle-${side} ${
          isResizing ? "resizing" : ""
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
