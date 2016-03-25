import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.flattenConcurrently', () => {
  describe('with map', () => {
    it('should expand each interval event with 3 sync events', (done) => {
      const stream = xs.interval(100).take(3)
      .map(i => xs.from([1 + i, 2 + i, 3 + i]))
      .flattenConcurrently();
      const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5];
      const listener = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
          if (expected.length === 0) {
            stream.removeListener(listener);
            done();
          }
        },
        error: done.fail,
        end: done.fail,
      };
      stream.addListener(listener);
    });

    it('should expand 3 sync events as an interval each', (done) => {
      const stream = xs.from([0, 1, 2])
        .map(i => xs.interval(100 * i).take(2).map(x => `${i}${x}`))
        .flattenConcurrently();
      // ---x---x---x---x---x---x
      // ---00--01
      // -------10------11
      // -----------20----------21
      const expected = ['00', '01', '10', '20', '11', '21'];
      const listener = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
          if (expected.length === 0) {
            stream.removeListener(listener);
            done();
          }
        },
        error: (err: any) => done(err),
        end: () => done(new Error('No end() should be called')),
      };
      stream.addListener(listener);
    });

    it('should expand 3 async events as an interval each', (done) => {
      const stream = xs.interval(140).take(3)
        .map(i =>
          xs.interval(100 * (i < 2 ? 1 : i)).take(3).map(x => `${i}${x}`)
        )
        .flattenConcurrently();
      // ---x---x---x---x---x---x---x---x---x---x---x---x
      // ---00--01--02
      //      ----10--11--12
      //           ------------20-----------21----------22
      const expected = ['00', '01', '10', '02', '11', '12', '20', '21', '22'];
      const observer = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
          if (expected.length === 0) {
            stream.unsubscribe(observer);
            done();
          }
        },
        error: (err: any) => done(err),
        end: () => done(new Error('No end() should be called')),
      };
      stream.subscribe(observer);
    });
  });
});