export class SpotifyNotLoggedInError extends Error {
  constructor() {
    super('Not logged in to Spotify');
    this.name = 'SpotifyNotLoggedInError';
  }
}

export class SpotifySessionExpiredError extends Error {
  constructor() {
    super('Spotify session expired');
    this.name = 'SpotifySessionExpiredError';
  }
}
