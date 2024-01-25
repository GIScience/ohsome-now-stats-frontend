import { UTCToLocalConverterPipe } from './utc-to-local-converter.pipe';

describe('UTCToLocalConverterPipe', () => {
  it('create an instance', () => {
    const pipe = new UTCToLocalConverterPipe();
    expect(pipe).toBeTruthy();
  });
});
