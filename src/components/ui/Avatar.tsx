import {Image, StyleSheet, View} from 'react-native';
import {colors} from '../../theme/tokens';
import {AppText} from './AppText';
import type {Member} from '../../domain/types';

type Props = {
  member?: Pick<Member, 'avatarColor' | 'avatarInitial' | 'photoUrl' | 'name'>;
  size?: number;
};

export function Avatar({member, size = 40}: Props) {
  const radius = size * 0.3;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: member?.avatarColor ?? colors.primaryFixed,
        },
      ]}>
      {member?.photoUrl ? (
        <Image source={{uri: member.photoUrl}} style={{width: size, height: size, borderRadius: radius}} />
      ) : (
        <AppText variant="labelMd" color={colors.onPrimaryFixed}>
          {member?.avatarInitial ?? '?'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
