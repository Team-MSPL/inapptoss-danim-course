import {
  BottomSheet,
  Button,
  colors,
  PartnerNavigation,
  Text,
  useBottomSheet,
} from '@toss-design-system/react-native';
import { useNavigation } from 'react-native-bedrock';

export default function NavigationBar() {
  const bottomSheet = useBottomSheet();
  const navigation = useNavigation();
  return (
    <PartnerNavigation
      title="다님"
      icon={{
        source: {
          uri: 'https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png',
        },
      }}
      // rightButtons={[
      //   {
      //     title: "내여행",
      //     id: "travle-list",
      //     icon: { name: "icon-plane-mono" },
      //     onPress: () => {
      //       bottomSheet.open({
      //         children: (
      //           <>
      //             <Text
      //               typography="t4"
      //               fontWeight="bold"
      //               color={colors.grey800}
      //               style={{ alignSelf: "center", marginTop: 35}}
      //             >
      //               내 여행 목록으로 이동하시겠어요?
      //             </Text>
      //             <Text
      //               typography="t5"
      //               fontWeight="regular"
      //               color={colors.grey600}
      //               style={{ textAlign: "center" }}
      //             >
      //               이동시 과정들은 저장되지 않아요
      //             </Text>
      //             <BottomSheet.CTA.Double
      //               leftButton={
      //                 <Button
      //                   type="dark"
      //                   style="weak"
      //                   display="block"
      //                   onPress={() => {
      //                     bottomSheet.close();
      //                   }}
      //                 >
      //                   {"아니오"}
      //                 </Button>
      //               }
      //               rightButton={
      //                 <Button
      //                   type="primary"
      //                   style="fill"
      //                   display="block"
      //                   onPress={() => {
      //                     navigation.reset({
      //                       index: 1,
      //                       routes: [
      //                         { name: "/" },
      //                         { name: "/my-travle-list" },
      //                       ],
      //                     });
      //                     // goNext(e);
      //                     bottomSheet.close();
      //                   }}
      //                 >
      //                   {"네"}
      //                 </Button>
      //               }
      //             ></BottomSheet.CTA.Double>
      //           </>
      //         ),
      //       });
      //     },
      //   },
      // ]}
    ></PartnerNavigation>
  );
}
