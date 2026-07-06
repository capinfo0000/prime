// お気に入り作品ID のローカル保存（AsyncStorage）

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favorites:v1';

export async function getFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  return (await getFavorites()).has(id);
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const favs = await getFavorites();
  const nowFav = !favs.has(id);
  if (nowFav) favs.add(id);
  else favs.delete(id);
  await AsyncStorage.setItem(KEY, JSON.stringify([...favs]));
  return nowFav;
}
