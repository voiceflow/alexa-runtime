export enum Command {
  NEXT = 'NextCommandIssued',
  PREV = 'PreviousCommandIssued',
  PLAY = 'PlayCommandIssued',
  PAUSE = 'PauseCommandIssued',
}

export enum IntentName {
  NEXT = 'AMAZON.NextIntent',
  PREV = 'AMAZON.PreviousIntent',
  PAUSE = 'AMAZON.PauseIntent',
  RESUME = 'AMAZON.ResumeIntent',
  FALLBACK = 'AMAZON.FallbackIntent',
}
