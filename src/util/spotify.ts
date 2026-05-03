import { runAppleScript } from './applescript.js';

const tell = (cmd: string): Promise<string> => runAppleScript(`tell application "Spotify" to ${cmd}`);

export async function launch(): Promise<void> {
  await runAppleScript('tell application "Spotify" to activate');
}

export async function play(): Promise<void> {
  await tell('play');
}

export async function pause(): Promise<void> {
  await tell('pause');
}

export async function playpause(): Promise<void> {
  await tell('playpause');
}

export async function nextTrack(): Promise<void> {
  await tell('next track');
}

export async function previousTrack(): Promise<void> {
  await tell('previous track');
}

export interface NowPlaying {
  artist: string;
  album: string;
  track: string;
}

export function getCurrentArtist(): Promise<string> {
  return tell('artist of the current track') ?? 'Unknown artist';
}

export function getCurrentAlbum(): Promise<string> {
  return tell('album of the current track') ?? 'Unknown album';
}

export function getCurrentTrack(): Promise<string> {
  return tell('name of the current track') ?? 'Unknown track';
}

export async function getNowPlaying(): Promise<NowPlaying> {
  const [artist, album, track] = await Promise.all([getCurrentArtist(), getCurrentAlbum(), getCurrentTrack()]);

  return { artist, album, track };
}

async function getVolume(): Promise<number> {
  const raw = await tell('sound volume');
  return parseInt(raw, 10);
}

async function setVolume(vol: number): Promise<void> {
  const clamped = Math.min(100, Math.max(0, vol));
  await tell(`set sound volume to ${clamped}`);
}

export async function volumeUp(): Promise<void> {
  const vol = await getVolume();
  await setVolume(vol + 5);
}

export async function volumeDown(): Promise<void> {
  const vol = await getVolume();
  await setVolume(vol - 5);
}
