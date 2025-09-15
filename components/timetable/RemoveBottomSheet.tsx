import {BottomSheet, Button, colors, Text} from "@toss-design-system/react-native";
import {TimetableState} from "./type";

type RemoveBottomSheetProps = {
    timetable: TimetableState;
    tooltips: { day: number; index: number; status: boolean };
    onDelete: () => void;
    bottomSheet: any;
};

export function RemoveBottomSheet({ timetable, tooltips, onDelete, bottomSheet }: RemoveBottomSheetProps) {
    const item = timetable[tooltips.day]?.[tooltips.index];
    if (!item) return null;

    return (
        <>
            <Text
                typography="t4"
                fontWeight="bold"
                color={colors.grey800}
                style={{
                    alignSelf: "center",
                    marginHorizontal: 40,
                    textAlign: "center",
                }}
            >
                '{item?.name}'일정을 삭제할까요?
            </Text>
            <Text
                typography="t5"
                fontWeight="regular"
                color={colors.grey600}
                style={{ textAlign: "center" }}
            >
                삭제한 일정은 나중에 직접 추가할 수 있어요.
            </Text>
            <BottomSheet.CTA.Double
                leftButton={
                    <Button type="dark" style="weak" display="block" onPress={() => bottomSheet.close()}>
                        닫기
                    </Button>
                }
                rightButton={
                    <Button
                        type="primary"
                        style="fill"
                        display="block"
                        onPress={() => {
                            onDelete();
                            bottomSheet.close();
                        }}
                    >
                        삭제하기
                    </Button>
                }
            />
        </>
    );
}