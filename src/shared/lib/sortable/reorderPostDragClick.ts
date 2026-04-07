/** Clears stale click suppression once a new input starts after drag end. */
export const shouldClearReorderPostDragSuppressionOnInput = ({
  isDragging,
  suppressNextClick,
}: {
  isDragging: boolean;
  suppressNextClick: boolean;
}): boolean => suppressNextClick && !isDragging;

/** Decides whether the next click should be swallowed after a completed drag. */
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
