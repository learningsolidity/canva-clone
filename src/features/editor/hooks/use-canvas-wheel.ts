import { fabric } from "fabric";
import { useEffect } from "react";

interface UseCanvasWheelProps {
  canvas: fabric.Canvas | null;
}

export const useCanvasWheel = ({ canvas }: UseCanvasWheelProps) => {
  useEffect(() => {
    if (!canvas) return;

    const handleWheel = (opt: fabric.IEvent<WheelEvent>) => {
      const delta = opt.e.deltaY;
      const zoom = canvas.getZoom();
      
      // Check for zoom modifiers (Cmd/Ctrl or Shift)
      if (opt.e.ctrlKey || opt.e.metaKey || opt.e.shiftKey) {
        // Zoom in/out
        let newZoom = zoom * (1 - delta / 200);
        
        // Limit zoom range
        if (newZoom > 2) newZoom = 2;
        if (newZoom < 0.2) newZoom = 0.2;
        
        const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
        canvas.zoomToPoint(point, newZoom);
      } else {
        // Vertical scroll (pan) with bounds
        const vpt = canvas.viewportTransform;
        if (vpt) {
          // Get all pages and sort by Y position
          const pages = canvas.getObjects()
            .filter(obj => obj.name && obj.name.startsWith('page-'))
            .sort((a, b) => a.top! - b.top!);
          
          if (pages.length > 0) {
            const canvasHeight = canvas.getHeight();
            const buffer = 500; // Generous buffer zone
            
            // Calculate content boundaries in world coordinates
            const topPage = pages[0];
            const bottomPage = pages[pages.length - 1];
            
            const contentTop = topPage.top! - buffer;
            const contentBottom = bottomPage.top! + bottomPage.height! + buffer;
            
            // Current viewport center in world coordinates
            const currentViewportCenterY = (-vpt[5] + canvasHeight / 2) / zoom;
            
            // Calculate new viewport center position
            const newDelta = delta / zoom;
            let newViewportCenterY = currentViewportCenterY + newDelta;
            
            // Apply bounds to viewport center
            if (newViewportCenterY < contentTop) {
              // Add resistance when scrolling past top
              const overshoot = contentTop - newViewportCenterY;
              newViewportCenterY = contentTop - overshoot * 0.3;
              // Hard limit
              if (newViewportCenterY < contentTop - 100) {
                newViewportCenterY = contentTop - 100;
              }
            } else if (newViewportCenterY > contentBottom) {
              // Add resistance when scrolling past bottom
              const overshoot = newViewportCenterY - contentBottom;
              newViewportCenterY = contentBottom + overshoot * 0.3;
              // Hard limit
              if (newViewportCenterY > contentBottom + 100) {
                newViewportCenterY = contentBottom + 100;
              }
            }
            
            // Convert back to viewport transform coordinate
            vpt[5] = -(newViewportCenterY * zoom - canvasHeight / 2);
          } else {
            // Fallback for single page
            vpt[5] -= delta;
          }
          
          canvas.requestRenderAll();
        }
      }
      
      // Prevent default browser scroll
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [canvas]);
};