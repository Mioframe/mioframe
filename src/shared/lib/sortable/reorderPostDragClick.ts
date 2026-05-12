/**
 * Clears stale click suppression once a new input starts after drag end.
 * @param root0
 */
export const shouldClearReorderPostDragSuppressionOnInput = ({
  isDragging,
  suppressNextClick,
}: {
  isDragging: boolean;
  suppressNextClick: boolean;
}): boolean => suppressNextClick && !isDragging;

/**
 * Decides whether the next click should be swallowed after a completed drag.
 * @param root0
 */
export const resolveReorderPostDragClick = ({
  suppressNextClick,
  isTargetInsideSurface,
}: {
  suppressNextClick: boolean;
  isTargetInsideSurface: boolean;
}) => ({
  clearSuppression: suppressNextClick,
  preventClick: suppressNextClick && isTargetInsideSurface,
});
