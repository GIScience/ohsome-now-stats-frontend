import { UTCToLocalConverterPipe } from './utc-to-local-converter.pipe';

describe('UTCToLocalConverterPipe', () => {

  let pipe: UTCToLocalConverterPipe;
  beforeEach(() => {
   pipe = new UTCToLocalConverterPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('test pipe handles errorcase', () => {
    //Arrange
    const dateToTest = new Date("2022-12-34");
    //Act
    const answer = pipe.transform(dateToTest, 'invalid');
    //Assert
    expect(answer).toEqual('Data not available');
  });
});
