/**
 * Типы ответов игрового сервера. Ответ приходит XML (или JSON) и разбирается в объект: атрибут `name` узла
 * становится полем `_name` со строковым значением, дочерние узлы — полями без подчёркивания, один узел приходит
 * объектом, несколько — массивом. Описаны только поля, которые читает приложение.
 */

/** Атрибуты узла: `_имя` → строка. */
export type Attrs = { [attribute: `_${string}`]: string };

/** Один дочерний узел приходит объектом, несколько — массивом. */
export type OneOrMany<T> = T | T[];

/** Ответ сервера до разбора по запросу: структура зависит от запроса, поэтому тип описывает вызывающий код. */
export type GameResponse = any;

/** Предмет награды: тип (6 — фрагмент коллекции, 8 — заточка, 11 — камень, 1 — фон) и id. */
export interface RewardItem {
	_type?: string | number;
	_id?: string | number;
	_item?: string | number;
}

/** Числовые поля награды: ресурсы (`_m1`, `_exp`, `_pf1` …). */
export type RewardFields = { [field: `_${string}`]: string | number | undefined };

/** Награда: ресурсы и список предметов `i`. */
export type Reward = RewardFields & { i?: OneOrMany<RewardItem> };

/** Предмет персонажа в ответе профиля (`i`): `_o` равно 1, если предмет есть у игрока. */
export interface OwnedItemNode extends Attrs {
	_id: string;
	_o: string;
}

/** Рейд игрока в ответе профиля (`uraid`). */
export interface RaidNode extends Attrs {
	rc?: OneOrMany<Attrs>;
	bp?: OneOrMany<Attrs>;
	rb?: OneOrMany<Attrs>;
	r?: Reward;
}

/** Ответ на запрос профиля (getStats): персонаж, предметы, рейд, здания на карте, сундуки, питомцы. */
export interface ProfileResponse {
	u: Attrs;
	i?: OneOrMany<OwnedItemNode>;
	uraid?: RaidNode;
	raids_cnt?: Attrs;
	j?: OneOrMany<Attrs>;
	chests?: { ch?: OneOrMany<Attrs> };
	mypets?: { p?: OneOrMany<Attrs> };
	pets?: { p?: OneOrMany<Attrs> };
	/** Заточки (свитки) по предметам: `_id` предмета и количество `_cnt` */
	iupgrade?: { i?: OneOrMany<Attrs> };
	/** Каталог магазина игры: `i` — предмет (`_id`, цены `_p1…_p6`, уровень `_l4`, признак личного `_is_p`, условия получения `_l1…_l16`) */
	shop?: { i?: OneOrMany<Attrs> };
	/**
	 * Коллекции: `col_t` — коллекция (`_id`, `_n`, `_it` — предмет за первую сборку, 0 у коллекций с ресурсами), `col_i` — её части (`_id`, `_t` — коллекция,
	 * `_n`, `_i` — картинка), `u_col` — сколько у игрока каждой части (`_i` — id части, `_q` — количество)
	 */
	collections?: { col_t?: OneOrMany<Attrs>; col_i?: OneOrMany<Attrs>; u_col?: OneOrMany<Attrs> };
	/**
	 * Камни инкрустации: `s` — каталог камней (`_t` вид 1–3, `_id` уровень 1–7, `_n`, `_bv` бонус, `_rst`/`_rsi`/`_rsc` — какие камни нужны для создания
	 * (вид, уровень, сколько), `_rm1…_rm8` — сколько ресурсов), `st` — сколько камней каждого вида и уровня у игрока (`_t`, `_id`, `_c`)
	 */
	stones?: { s?: OneOrMany<Attrs>; st?: OneOrMany<Attrs> };
	/** Сколько раз игрок собрал каждую коллекцию: `_id` коллекции и `_cnt` */
	ucollc?: { i?: OneOrMany<Attrs> };
	/** Все боссы игры: `u` — босс (`_rid`, `_rn` — место на карте, `_type`, `_epr` — энергия, `_rq1` — уровень, `_rlmt` — попыток), `r` — награда */
	npcs?: { npc?: OneOrMany<{ u: Attrs; r?: Attrs }>; /** Сколько раз игрок убил каждого босса: `_id` босса и `_v` убийств */ kill?: OneOrMany<Attrs> };
}

/** Гильдия в ответе на запрос `i: 49`: здания и история событий. */
export interface GuildResponse {
	bldngs?: { b?: OneOrMany<Attrs> };
	hist?: { h?: OneOrMany<Attrs> };
}
