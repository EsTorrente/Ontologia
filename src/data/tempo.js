// The rhythm of her thoughts: a clock-like metronome at a steady 65 bpm, with one song in the middle.
// The ticks begin with the title; once the first text has been written they sink away under the song (public/assets/sounds/song-04.mp3);
// when the song is about to end they come back, at 65 bpm again.
export const TEMPO = {
  start: 65,        // bpm from the title on
  glide: 2.6,       // default time (s) for a tempo change to settle
  level: .5,        // loudness of the ticks (0..1)
  // Optional tempo changes by scene (scenes.js index). A number = steady; [from, to] = ramp across that scene's passages; { bpm, glide } = also how lazily it changes.
  // Empty on purpose: the beat stays at 65. Example:  6: [70, 100],   // "Quiero ser humana"
  // (Tempo changes only apply while the metronome is the one playing: before the song starts. After the song it holds `track.after`.)
  scenes: {},
  // when: 'typed' = once that passage has finished being written ('shown' = the moment it appears)
  // fadeIn / fadeOut: seconds for the song to rise / the ticks to sink away. tail: the ticks return when this many seconds of the song remain
  // (its last seconds are silent). back: seconds for the ticks to fade back in. after: the tempo they come back at, and keep.
  track: { scene: 0, k: 0, when: 'typed', file: 'song-04.mp3', fadeIn: 3, fadeOut: 4, tail: 3.5, back: 2, after: 65 },
}
