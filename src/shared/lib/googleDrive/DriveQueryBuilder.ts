const printBoolean = (v: boolean) => v.toString();

export class DriveQueryBuilder {
  private parts: string[] = [];

  private escape(value: string): string {
    return value.replace(/'/g, "\\'");
  }

  /**
   * Файл находится внутри указанной папки
   * @param parentId
   */
  inParents(parentId: string): this {
    this.parts.push(`'${this.escape(parentId)}' in parents`);
    return this;
  }

  /**
   * Поиск по точному имени
   * @param name
   */
  nameEquals(name: string): this {
    this.parts.push(`name = '${this.escape(name)}'`);
    return this;
  }

  /**
   * Поиск по частичному совпадению имени
   * @param text
   */
  nameContains(text: string): this {
    this.parts.push(`name contains '${this.escape(text)}'`);
    return this;
  }

  /**
   * Фильтрация по MIME-типу
   * @param type
   */
  mimeType(type: string): this {
    this.parts.push(`mimeType = '${this.escape(type)}'`);
    return this;
  }

  /**
   * Исключить (или включить) файлы в корзине
   * @param isTrashed
   */
  trashed(isTrashed: boolean = false): this {
    this.parts.push(`trashed = ${printBoolean(isTrashed)}`);
    return this;
  }

  /** Только файлы доступные мне (Shared with me) */
  sharedWithMe(): this {
    this.parts.push(`sharedWithMe = true`);
    return this;
  }

  // --- Логические операторы ---

  and(): this {
    this.parts.push('and');
    return this;
  }

  or(): this {
    this.parts.push('or');
    return this;
  }

  /**
   * Группировка условий в скобки: (condition)
   * @param builderFn
   */
  group(builderFn: (b: DriveQueryBuilder) => void): this {
    const subBuilder = new DriveQueryBuilder();
    builderFn(subBuilder);
    const subQuery = subBuilder.build();
    if (subQuery) {
      this.parts.push(`(${subQuery})`);
    }
    return this;
  }

  /**
   * Инверсия: not (condition)
   * @param builderFn
   */
  not(builderFn: (b: DriveQueryBuilder) => void): this {
    const subBuilder = new DriveQueryBuilder();
    builderFn(subBuilder);
    const subQuery = subBuilder.build();
    if (subQuery) {
      this.parts.push(`not (${subQuery})`);
    }
    return this;
  }

  // --- Генерация ---

  build(): string {
    return this.parts.join(' ');
  }
}
