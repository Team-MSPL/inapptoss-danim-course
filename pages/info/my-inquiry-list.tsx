import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { colors, FixedBottomCTAProvider, Top } from "@toss-design-system/react-native";
import { useAppSelector } from "store";

export const Route = createRoute('/info/my-inquiry-list', {
  validateParams: (params) => params,
  component: InfoMyInquiryList,
});

const DANIM_PROFILE =
  'https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png';

function InfoMyInquiryList() {
  const jwtToken = useAppSelector(state => state.travelSlice.userJwtToken);
  const [notes, setNotes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('https://danimdatabase.com/user/noteList', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
        });
        if (!res.ok) {
          if (res.status === 401) throw new Error('로그인이 필요합니다.');
          if (res.status === 500) throw new Error('서버 에러');
          throw new Error('알 수 없는 에러');
        }
        const data = await res.json();
        setNotes(data);
      } catch (e: any) {
        Alert.alert('쪽지 불러오기 실패', e.message || String(e));
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [jwtToken]);

  return (
    <View style={styles.root}>
      <Top.Root
        title={
          <Top.TitleParagraph typography="t3" color={colors.grey900}>
            쪽지함
          </Top.TitleParagraph>
        }
      />
      <FixedBottomCTAProvider>
        {loading ? (
          <ActivityIndicator size="large" color="#888" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView>
            {(notes && notes.length > 0)
              ? notes.map((note, idx) => (
                <View key={idx} style={styles.noteBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Image source={{ uri: DANIM_PROFILE }} style={styles.profileImg} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.nick}>다님</Text>
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  </View>
                </View>
              ))
              : (
                <Text style={{ color: '#999', textAlign: 'center', marginTop: 80 }}>
                  쪽지가 없습니다.
                </Text>
              )
            }
          </ScrollView>
        )}
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noteBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 14,
    marginBottom: 18,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  nick: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#23262F',
  },
  noteText: {
    fontSize: 15,
    color: '#23262F',
    lineHeight: 22,
  },
});

export default InfoMyInquiryList;