
export class Helpers {

  public static async sleep(amt: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve();
      }, amt);
    });
  }
}