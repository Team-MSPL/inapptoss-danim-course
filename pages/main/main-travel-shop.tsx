import React, { useEffect, useCallback, useState } from "react";
import { View, FlatList, Pressable, Dimensions } from "react-native";
import { useNavigation } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import {
    colors,
    Top,
    Text,
    Badge,
    Icon,
    Button,
    Skeleton,
    AnimateSkeleton,
} from "@toss-design-system/react-native";
import ProductCard from "../../components/main/product-card";
import { getProductList } from "../../redux/travle-slice";
import {DUMMY_PRODUCTS} from "../../components/main/constants";

export default function MainTravelShop() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const { productList, total, loading, error, sortType } = useAppSelector((state) => state.product);
    const [refreshing, setRefreshing] = useState(false);

    // 실제 파라미터는 props/state/검색값 등으로 대체
    const params = {
        country: "베트남",
        type: "package",
        page: 1,
        limit: 20,
        recommendMode: "true",
        sort: sortType,
    };

    useEffect(() => {
        dispatch(getProductList(params));
    }, [sortType]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        dispatch(getProductList(params)).finally(() => setRefreshing(false));
    }, [dispatch, params]);

    const renderHeader = () => (
        <View style={{ backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 16 }}>

            <Text typography="t7" color={colors.grey500} style={{ marginBottom: 6 }}>
                상품 추천
            </Text>
            <Text typography="t2" fontWeight="bold" style={{ marginBottom: 2 }}>
                나그네님을 위한 맞춤 여행 상품
            </Text>
            <Text typography="t7" color={colors.grey500} style={{ marginBottom: 14 }}>
                내 여정과 어울리는 여행 상품을 추천해드려요
            </Text>
            <View
                style={{
                    backgroundColor: "#FFF4F3",
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    padding: 10,
                    marginBottom: 14,
                }}
            >
                <Icon name="icon-lock-mono" color={colors.red300} size={22} style={{ marginRight: 6 }} />
                <Text typography="t7" color={colors.red400} fontWeight="bold">
                    최저가로 즐기는 특별한 여행!
                </Text>
            </View>
            {/*<View*/}
            {/*    style={{*/}
            {/*        flexDirection: "row",*/}
            {/*        alignItems: "center",*/}
            {/*        justifyContent: "space-between",*/}
            {/*        marginBottom: 8,*/}
            {/*    }}*/}
            {/*>*/}
            {/*    <Text typography="t7" color={colors.grey700}>*/}
            {/*        총 {total}개*/}
            {/*    </Text>*/}
            {/*    <View style={{ flexDirection: "row", alignItems: "center" }}>*/}
            {/*        <Icon name="icon-filter-mono" color={colors.blue500} size={18} />*/}
            {/*        <Pressable*/}
            {/*            style={{ flexDirection: "row", alignItems: "center", marginLeft: 6 }}*/}
            {/*            onPress={() => {*/}
            {/*                // TODO: 정렬 팝업/액션시트 구현*/}
            {/*            }}*/}
            {/*        >*/}
            {/*            <Text typography="t7" color={colors.blue500} style={{ marginRight: 2 }}>*/}
            {/*                추천순*/}
            {/*            </Text>*/}
            {/*            <Icon name="icon-chevron-down-mono" color={colors.blue500} size={16} />*/}
            {/*        </Pressable>*/}
            {/*    </View>*/}
            {/*</View>*/}
        </View>
    );

    // 서버 응답이 "조건에 맞는 판매 상품이 없습니다." 형태일 때 체크
    const isNoProduct =
        !loading &&
        (
            (Array.isArray(productList) && productList.length === 0) ||
            (productList && typeof productList === "object" && productList.message === "조건에 맞는 판매 상품이 없습니다.")
        );

    if (loading && !refreshing) {
        return (
            <AnimateSkeleton delay={400} withGradient={true} withShimmer={true}>
                {[...Array(4)].map((_, i) => (
                    <Skeleton
                        key={i}
                        height={110}
                        width={Dimensions.get("window").width - 32}
                        style={{ marginTop: i > 0 ? 24 : 0, alignSelf: "center", borderRadius: 16 }}
                    />
                ))}
            </AnimateSkeleton>
        );
    }

    if (error && !isNoProduct) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text typography="t4" color={colors.red400} style={{ marginBottom: 14 }}>
                    {typeof error === "string" ? error : "상품을 불러오는데 실패했습니다."}
                </Text>
                <Button onPress={onRefresh}>다시 시도</Button>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
            <FlatList
                data={
                    isNoProduct
                        ? DUMMY_PRODUCTS // 조건에 맞는 상품 없으면 더미 상품 표시
                        : Array.isArray(productList) && productList.length > 0
                            ? productList
                            : DUMMY_PRODUCTS // productList가 비어 있으면 더미로
                }
                keyExtractor={(item) => item?.product?._id ?? item?._id ?? Math.random().toString()}
                renderItem={({ item }) => {
                    if (!item || !item.product) return null; // 없으면 렌더하지 않음
                    return (
                        <ProductCard
                            product={item.product}
                            onPress={() => {}}
                        />
                    );
                }}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    isNoProduct ? (
                        <View style={{ alignItems: "center", marginTop: 40 }}>
                            <Text typography="t4" color={colors.grey500} style={{ marginBottom: 10 }}>
                                조건에 맞는 상품이 없습니다.
                            </Text>
                        </View>
                    ) : null
                }
            />
            {/*/!* 조건에 맞는 상품이 없을 때 별도 안내문구 (더미 상품 아래에 표시) *!/*/}
            {/*{isNoProduct && (*/}
            {/*    <View style={{ position: "absolute", top: 180, left: 0, right: 0, alignItems: "center" }}>*/}
            {/*        <Text typography="t4" color={colors.grey500}>조건에 맞는 상품이 없습니다. (더미 상품이 표시됩니다)</Text>*/}
            {/*    </View>*/}
            {/*)}*/}
        </View>
    );
}