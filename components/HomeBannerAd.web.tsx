/**
 * HomeBannerAd — Web stub
 * react-native-google-mobile-ads is native-only; render nothing on web.
 */
import React from 'react';
import { View } from 'react-native';

interface Props {
  unitId: string;
}

export default function HomeBannerAd(_props: Props) {
  return <View style={{ height: 0 }} />;
}
