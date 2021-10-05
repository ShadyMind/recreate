interface Constructor<T> {
  new (...args: any[]): T;
}

type Indexer = string | number | symbol;

type Constructed<T extends Record<Indexer, any>> = {
  [key in keyof T]: T[keyof T];
} & {
  constructor: Constructor<T>;
};

type Stack = Array<[Constructed<any>, Constructed<any>]>;

function createLikenessEmptyObject<T extends Constructed<any>>(object: T): T {
  return new object.constructor();
}

export default function recreate<T extends Constructed<T>>(object: T): T {
  if (!(object instanceof Object)) {
    return object;
  }
  const result: T = createLikenessEmptyObject(object);
  const stack: Stack = [[result, object]];

  let nextStackElement: Stack[number] | undefined;
  while ((nextStackElement = stack.shift())) {
    if (nextStackElement === undefined) {
      return result;
    }
    const [target, nextObject] = nextStackElement;

    for (const key of Object.keys(nextObject)) {
      if (nextObject[key] instanceof Object) {
        const freshObject = createLikenessEmptyObject(nextObject[key]);
        target[key] = freshObject;
        stack.push([freshObject, nextObject[key]]);
        continue;
      }
      if (target instanceof Map) {
        target.set(key, nextObject[key]);
      } else if (target instanceof Set) {
        target.set(nextObject);
      } else {
        target[key] = nextObject[key];
      }
    }
  }
  return result;
}
