import React from "react";
import { Dimensions, TouchableOpacity, View, Image } from "react-native";
import {
    colors,
    FixedBottomCTAProvider,
    ListRow,
    PartnerNavigation,
    Top,
    Text,
} from "@toss-design-system/react-native";

export default function MainScreen() {
    return (
        <View style={{ flex: 1 }}>
            <PartnerNavigation
                title="가고싶은 여행코스 AI 추천"
                icon={{
                    source: {
                        uri: "https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png",
                    },
                }}
            ></PartnerNavigation>
            <FixedBottomCTAProvider>
                <Top
                    title={
                        <Text typography="t6" fontWeight="medium" color={colors.grey600}>
                            1분 투자로 하루 아끼기!
                        </Text>
                    }
                    subtitle1={
                        <Text typography="t3" fontWeight="bold" color={colors.grey900}>
                            여행지부터 일정까지,{`\n`}다님 AI 추천해 줄게요
                        </Text>
                    }
                ></Top>
                <View style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 20, marginTop: 30}}>
                    <TouchableOpacity
                        onPress={() => {}}
                        style={{
                            width: Dimensions.get('window').width - 48,
                            alignSelf: 'center',
                            height: 165,
                            borderRadius: 20,
                            overflow: 'hidden', // 이미지가 둥글게 잘리도록
                        }}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{
                                uri: "https://firebasestorage.googleapis.com/v0/b/danim-image/o/appintoss_main%2Fappintoss-main2.png?alt=media&token=a2875a2d-2f7f-4218-bd13-1254198cea3c",
                            }}
                            style={{
                                width: "100%",
                                height: "100%",
                                resizeMode: "cover",
                            }}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {}}
                        style={{
                            width: Dimensions.get('window').width - 48,
                            alignSelf: 'center',
                            height: 165,
                            borderRadius: 20,
                            overflow: 'hidden', // 이미지가 둥글게 잘리도록
                        }}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{
                                uri: "https://firebasestorage.googleapis.com/v0/b/danim-image/o/appintoss_main%2Fappintoss-main1.png?alt=media&token=6932a5ba-3506-4c2b-a2bb-9ea2cd5aff66",
                            }}
                            style={{
                                width: "100%",
                                height: "100%",
                                resizeMode: "cover",
                            }}
                        />
                    </TouchableOpacity>
                </View>
            </FixedBottomCTAProvider>
        </View>
    );
}