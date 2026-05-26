import React, { forwardRef, useCallback } from 'react';
import GBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors } from '../../constants/colors';

type Props = {
  snapPoints: (string | number)[];
  children: React.ReactNode;
};

export type BottomSheetRef = GBottomSheet;

export const BottomSheet = forwardRef<GBottomSheet, Props>(
  ({ snapPoints, children }, ref) => {
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    return (
      <GBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.background.card }}
        handleIndicatorStyle={{ backgroundColor: colors.text.secondary }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView>{children}</BottomSheetView>
      </GBottomSheet>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
