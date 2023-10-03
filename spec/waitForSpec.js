import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";

/**
 * For making dom-testing-library compatible with jasmine
 */
function enableFakeJestMode() {
  globalThis.jest = {
    /**
     * Use jasmine.clock instead
     */
    advanceTimersByTime: (delay) => {
      globalThis.jasmine.clock().tick(delay);
    },
  };
}

describe("jasmine", () => {
  describe("with jasmine.clock installed", () => {
    beforeEach(() => {
      enableFakeJestMode();
      jasmine.clock().install();
      /**
       * jasmine.clock replaced the global `setTimeout` with a mocked one, so we need to add the `_isMockFunction`
       *
       * For jestFakeTimersAreEnabled
       * @see https://github.com/testing-library/dom-testing-library/blob/a7b725257e61370675ee043813003d36fae23e9d/src/helpers.ts#L5
       * For usingJestFakeTimers
       * @see https://github.com/testing-library/dom-testing-library/blob/a7b725257e61370675ee043813003d36fae23e9d/src/wait-for.js#L51-L52
       *
       */
      Object.assign(globalThis.setTimeout, { _isMockFunction: true });
    });

    afterEach(async () => {
      // cleaning-up
      jasmine.clock().uninstall();
      delete globalThis.setTimeout._isMockFunction;
      delete globalThis.jest;

      delete window.leaking;
      expect(window.leaking).toBeUndefined();
      await act(() => new Promise((res) => setTimeout(res, 0)));
      // 👇 This should fail
      expect(window.leaking).toBeUndefined();
    });

    it("simulates a timeout", async () => {
      render(<span>Will never be found</span>);

      try {
        await waitFor(
          () => {
            console.log(
              "%c spec",
              "color: lime; font-weight: bold",
              "waitfor:callback",
            );
            window.leaking = true;
            // The button shouldn't be found, so it will throw/fail the inner waitFor callback predicate
            screen.getByRole("button");
          },
          { interval: 6000 },
        );
        fail("Should have failed");
      } catch (error) {
        console.log("%c spec", "color: #f80; font-weight: bold", "finished ✅");
        expect().nothing();
      }
    });
  });
});
