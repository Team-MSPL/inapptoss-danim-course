import React from "react";
import { Dimensions, TouchableOpacity, View, Image } from "react-native";
import {
    colors,
    FixedBottomCTAProvider,
    PartnerNavigation,
    Top,
    Text, Badge,
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
                            overflow: 'hidden',
                            marginBottom: 0,
                            backgroundColor: "#eee",
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
                                position: "absolute",
                            }}
                        />
                        <Badge
                            size="medium"
                            type="blue"
                            badgeStyle="fill"
                            style={{
                                position: "absolute",
                                top: 18,
                                right: 18,
                                zIndex: 2,
                            }}
                        >
                            여행 지역 추천
                        </Badge>
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 1,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text
                                    typography="t4"
                                    fontWeight="bold"
                                    color="#fff"
                                    style={{
                                        textAlign: "center",
                                        textShadowColor: "rgba(0,0,0,0.18)",
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 6,
                                    }}
                                >
                                    여행은 가고 싶은데{'\n'}어디로 갈지 고민이라면?
                                </Text>
                                <Text
                                    typography="t1"
                                    fontWeight="bold"
                                    color="#fff"
                                    style={{
                                        marginLeft: 10,
                                        textShadowColor: "rgba(0,0,0,0.12)",
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 6,
                                        fontSize: 22,
                                    }}
                                >
                                    →
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {}}
                        style={{
                            width: Dimensions.get('window').width - 48,
                            alignSelf: 'center',
                            height: 165,
                            borderRadius: 20,
                            overflow: 'hidden',
                            marginBottom: 0,
                            backgroundColor: "#eee",
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
                                position: "absolute",
                            }}
                        />
                        <Badge
                            size="medium"
                            type="green"
                            badgeStyle="fill"
                            style={{
                                position: "absolute",
                                top: 18,
                                right: 18,
                                zIndex: 2,
                            }}
                        >
                            여행 지역 추천
                        </Badge>
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 1,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text
                                    typography="t4"
                                    fontWeight="bold"
                                    color="#fff"
                                    style={{
                                        textAlign: "center",
                                        textShadowColor: "rgba(0,0,0,0.18)",
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 6,
                                    }}
                                >
                                    여행지는 골랐는데{'\n'}계획 세우기 귀찮다면?
                                </Text>
                                <Text
                                    typography="t1"
                                    fontWeight="bold"
                                    color="#fff"
                                    style={{
                                        marginLeft: 10,
                                        textShadowColor: "rgba(0,0,0,0.12)",
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 6,
                                        fontSize: 22,
                                    }}
                                >
                                    →
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </FixedBottomCTAProvider>
        </View>
    );
}