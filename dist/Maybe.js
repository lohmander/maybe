import { isJust, isNothing } from "./utils";
/**
 * Maybe<T> - A container for optional values.
 *
 * Represents either:
 *  - Just<T>: a present value of type T
 *  - Nothing: absence of value (null or undefined)
 *
 * Inspired by functional programming but designed for JS/TS ergonomics.
 */
export class Maybe {
    _value;
    constructor(_value) {
        this._value = _value;
    }
    /**
     * Create a Maybe from a nullable value.
     *
     * @param value - A value that may be null or undefined.
     * @returns A Maybe wrapping the value. Null/undefined become Nothing.
     */
    static fromNullable(value) {
        return new Maybe(value);
    }
    /**
     * Transform the value if present, otherwise propagate Nothing.
     *
     * @param fn - A function mapping the contained value to a new value.
     * @returns A new Maybe of the mapped value, or Nothing if empty.
     */
    map(fn) {
        if (isNothing(this._value))
            return new Maybe(this._value);
        return new Maybe(fn(this._value));
    }
    /**
     * Transform the value with a function returning Maybe.
     * If Nothing, propagates Nothing.
     *
     * @param fn - A function mapping the contained value to a Maybe.
     * @returns The resulting Maybe from applying the function, or Nothing if empty.
     */
    flatMap(fn) {
        if (isNothing(this._value))
            return new Maybe(this._value);
        return fn(this._value);
    }
    /**
     * Replace Nothing with a default value, still wrapped in Maybe.
     * Keeps chaining possible.
     *
     * @param defaultValue - The value to use if this is Nothing.
     * @returns A Maybe containing the original or default value.
     */
    withDefault(defaultValue) {
        return isNothing(this._value) ? new Maybe(defaultValue) : this;
    }
    /**
     * Replace Nothing with a default value and unwrap.
     * Ends the pipeline.
     *
     * @param defaultValue - The value to return if this is Nothing.
     * @returns The contained value if present, otherwise the default.
     */
    getOrElse(defaultValue) {
        return isNothing(this._value) ? defaultValue : this._value;
    }
    /**
     * Run a side-effect if Just; return the same Maybe.
     *
     * @param fn - A function executed with the contained value if present.
     * @returns This Maybe instance, unchanged.
     */
    effect(fn) {
        if (isJust(this._value))
            fn(this._value);
        return this;
    }
    filter(predicate) {
        if (isNothing(this._value) || !predicate(this._value))
            return new Maybe(null);
        return new Maybe(this._value);
    }
    /**
     * Extend an object with a new property if present.
     *
     * @param key - The property name to add.
     * @param fn - A function returning a Maybe of the new property value.
     * @returns A Maybe of the extended object, or Nothing if empty or not an object.
     */
    extend(key, fn) {
        if (isNothing(this._value) || typeof this._value !== "object")
            return new Maybe(null);
        // Use a broadly-typed approach here to keep the API ergonomic.
        return this.flatMap((obj) => fn(obj).map((u) => ({ ...obj, [key]: u })));
    }
    /**
     * Assign one or more properties to an object inside a Maybe.
     * Runs all property functions and short-circuits to Nothing if:
     * - the Maybe is Nothing
     * - the value is not an object
     * - any property function returns Nothing
     *
     * @param fns - An object where keys are property names and values are functions
     *              returning a Maybe of the property value.
     * @returns A Maybe of the extended object, or Nothing if short-circuited.
     */
    assign(fns) {
        if (isNothing(this._value) || typeof this._value !== "object")
            return new Maybe(null);
        const obj = this._value;
        return Object.entries(fns).reduce((acc, [k, fn]) => acc.flatMap((lastVal) => fn(obj).map((v) => ({ ...lastVal, [k]: v }))), new Maybe(obj));
    }
    /**
     * Map and filter over an array inside a Maybe.
     * If Nothing, returns Nothing. If Just with an array,
     * applies the function to each element, keeping only Just results.
     *
     * @typeParam U - The element type of the original array.
     * @typeParam V - The element type of the resulting array.
     * @param fn - A function mapping each element to a Maybe.
     * @returns A Maybe of the filtered/mapped array, or Nothing if empty.
     */
    filterMap(fn) {
        if (isNothing(this._value))
            return new Maybe(null);
        const arr = this._value;
        const result = [];
        for (const el of arr) {
            const maybeVal = fn(el);
            if (!(maybeVal instanceof Maybe))
                return Maybe.fromNullable(null);
            if (isJust(maybeVal.value()))
                result.push(maybeVal.value());
        }
        return new Maybe(result);
    }
    /**
     * Access the raw inner value.
     *
     * Escape hatch; prefer getOrElse() in most cases.
     *
     * @returns The contained value if present, otherwise null or undefined.
     */
    value() {
        return this._value;
    }
}
//# sourceMappingURL=Maybe.js.map