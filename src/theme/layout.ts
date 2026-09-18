import {StyleSheet, useWindowDimensions} from 'react-native';
import {spacing} from './tokens';

export const COMPACT_BREAKPOINT = 380;

export function useCompactLayout() {
  const {width, height} = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  return {
    width,
    height,
    compact,
    gutter: compact ? spacing.gutter : spacing.margin,
  };
}

export const layout = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  fill: {
    flex: 1,
  },
  shrink0: {
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  wrap: {
    flexWrap: 'wrap',
  },
});
