import React from "react";
import {Dimensions, TouchableOpacity, View} from "react-native";
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
                            backgroundColor: 'yellow',
                            width: Dimensions.get('window').width - 48,
                            alignSelf: 'center',
                            height: 165,
                            borderRadius: 20}}
                    >

                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {}}
                        style={{
                            backgroundColor: 'purple',
                            width: Dimensions.get('window').width - 48,
                            alignSelf: 'center',
                            height: 165,
                            borderRadius: 20}}
                    >

                    </TouchableOpacity>
                </View>
            </FixedBottomCTAProvider>
        </View>
    );
}