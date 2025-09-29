import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/info/my-inquiry-list', {
  validateParams: (params) => params,
  component: InfoMyInquiryList,
});

function InfoMyInquiryList() {
  return (
    <View>
      <Text>문의 내용 불러오기 api 있는지</Text>
      <Text>어쩌구저ㄱ쩌구</Text>
    </View>
  );
}
