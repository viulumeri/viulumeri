export interface SongMetadata {
  title: string
  composer?: string
}

export interface Song {
  id: string
  title: string
  audioBundle: string
  metadata: SongMetadata
}

export interface SongListItem extends Omit<Song, 'audioBundle'> {
  // This is what the client receives from GET /api/songs
}