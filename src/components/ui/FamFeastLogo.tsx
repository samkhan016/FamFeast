import {Image, StyleSheet} from 'react-native';

const logo = require('../../assets/images/famfeast-logo-round.png');

export function FamFeastLogo({size = 40, decorative = false}: {size?: number; decorative?: boolean}) {
  return (
    <Image
      source={logo}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : 'FamFeast Logo'}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no' : 'auto'}
      resizeMode="contain"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    flexShrink: 0,
  },
});
