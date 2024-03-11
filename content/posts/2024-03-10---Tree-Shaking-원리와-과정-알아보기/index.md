---
title: Tree-Shaking의 원리와 과정 알아보기
date: "2024-03-10"
template: "post"
draft: false
slug: "/posts/deep-dive-tree-shaking"
category: "Tech"
description: "Deep Dive Tree Shaking"
---

## TL;DR

- 트리 셰이킹이란 자바스크립트 컨텍스트에서 데드 코드 제거를 설명하는 용어로 **번들러에 의해 수행**됩니다.
- 각 번들러에 따라 트리셰이킹을 구현하는 내부 원리는 조금씩 다를 수 있지만, 기본적으로 **1)** 모듈을 추상구문트리 형태로 시각화하여 서로 간의 의존성을 분석 **2)** 의존성 분석 결과를 바탕으로, 사용되지 않는 코드를 식별 **3)** 식별한 불필요한 코드 제거의 형태로 이루어집니다.
- 위에서 언급한 트리쉐이킹의 과정 중에서 각 모듈 간의 의존성을 분석하는 정적 분석이 필요하기 때문에 정적분석이 어려운 CJS로 작성된 코드는 적합하지 않습니다. 트리쉐이킹을 지원하고 싶다면 ESM으로 작성해야 합니다.

<br />
<br />

몇달 전 프로젝트 최적화의 일환으로 번들링된 파일 사이즈를 줄이기 위해서 불필요한 의존성 패키지를 제거하고, 사용하는 의존성은 좀 더 가벼운 것이나 트리쉐이킹이 가능한 것으로 대체하는 작업을 진행한 적이 있다.

그 과정에서 트리쉐이킹을 지원하는 라이브러리에 대해 찾아 보았는데 관련해서 가장 많이 나오는 사례가 바로 `lodash`다. 다수의 글에서 트리쉐이킹을 최적화 하기 위해 `lodash`를 체리피킹하여 `import debounce from ‘lodash/debounce’`와 같은 식으로 사용하거나 ES6 구문으로 쓰여진 `lodash-es`를 사용 하라고 이야기 한다.

나는 여기서 몇 가지 궁금증이 생겼다 🤔

- 트리쉐이킹을 지원하고 안하고는 어디서 어떻게 결정되는 것인가?
- 어떻게 해야 트리쉐이킹을 지원하는 라이브러리를 만들 수 있는가?
- 왜 ES6 구문으로 쓰여진 `lodash-es`는 트리쉐이킹에 더 용이한 것일까?
- 트리쉐이킹은 어떤 원리와 과정을 통해 이루어지는가?

그리고 다음의 의문을 해소하기 위해서 트리쉐이킹에 대해 좀 더 깊게 알아보기로 했다.

## 트리쉐이킹이란?

트리쉐이킹의 정의부터 살펴보자.

> **Tree shaking** is a term commonly used within a JavaScript context to describe the removal of dead code. It relies on the [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) and [export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) statements to detect if code modules are exported and imported for use between JavaScript files.

[MDN 문서](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)에 따르면 **“트리쉐이킹은 자바스크립트 컨텍스트에서 데드 코드 제거를 설명하기 위해 일반적으로 사용되는 용어입니다. import 및 export 문에 의존하여 JavaScript 파일 간에 내보내지고 가져와지는 코드 모듈들을 감지합니다.”** 라고 한다.

조금 더 풀어서 설명해보자. 어플리케이션은 개발자가 직접 작성한 코드, 외부 라이브러리 등 다양한 코드조각(모듈)들로 이루어져 있다. 그리고 이러한 코드조각들은 빌드 과정에서 webpack이나 Rollup과 같은 번들러에 의해 커다란 덩어리로 합쳐지게 된다. 그러면 이 커다란 덩어리안에는 오직 우리가 사용하는 코드로만 가득 차 있을까? 혹 불필요한 코드가 들어있진 않을까?

예를 들어보겠다. 앞서 언급했던 `lodash`를 다시 꺼내보자. 어플리케이션에 `lodash`를 설치하고 `import cloneDeep from ‘lodash’` 와 같은 형태로 cloneDeep 함수를 사용한다. 그리고 빌드를 하면 어떻게 될까? 내가 `lodash`에서 사용한 것은 오직 cloneDeep 함수이지만 번들링 된 결과물에는 lodash의 코드 전부가 들어가게 된다. 사용하지 않는 코드들이 불필요하게 자리를 차지해 덩어리를 키우게 되는 것이다.

자연스럽게 사용하지 않는 죽은 코드들을 제거하고 오직 cloneDeep 함수의 코드만 빼내 빌드 결과물에 포함하고 싶단 생각이 들 것이다. 그리고 이걸 구현한 것이 바로 트리쉐이킹이다.

![treeShaking](/media/treeShaking.png)

마치 나무를 흔들어서 죽은 나뭇잎들을 떨어뜨리듯, 코드를 빌드할 때도 애플리케이션의 내보내기 및 가져오기를 트리 형태로 시각화하여 어플리케이션에 사용하는 건강한 코드(나뭇잎) 살리고, 실제로 쓰지 않는 코드들을 제외한다는 뜻으로 Tree Shaking이란 이름이 붙여졌다고 한다. 이 기능은 Webpack이나 Rollup과 같은 번들러를 통해 수행되며, 초기에 트리쉐이킹을 고안하고 알린 것은 Rollup이라고 한다.

---

## 트리쉐이킹의 구현 원리와 과정

그렇다면 모듈 번들러는 어떤 원리와 과정을 통해 트리쉐이킹을 구현하는 것일까?

앞선 내용에서 힌트를 얻을 수 있다. MDN의 설명에서 트리쉐이킹은 import문과 export문에 의존한다고 쓰여있다. 또 애플리케이션의 내보내기 및 가져오기를 트리 형태로 시각화한다,는 언급도 했었다. 각 번들러마다 트리쉐이킹을 구현하는 세부 로직은 다르지만 기본적으로 다음과 같은 과정을 거쳐 동작한다.

![rootNode](/media/rootNode.png)

1. **의존성 분석** : 번들러는 애플리케이션의 시작점(예: **`index.js`**)에서 부터 시작하여, 모듈 간의 의존성을 분석합니다. 코드의 의존성을 분석하기 위해 소스 코드를 파싱하여 AST(Abstract Syntax Tree, 추상 구문 트리)를 생성하고 각 모듈이 어떤 다른 모듈을 필요로 하는지, 그리고 어떤 함수나 변수가 사용되는지 파악합니다.
2. **사용되지 않는 코드 식별**: 의존성 분석 결과를 바탕으로, 실제로 사용 되지 않는 함수나 변수, 즉 어디서도 호출되거나 참조되지 않는 코드를 식별합니다. 이 과정은 정적 분석을 통해 수행 되며, 대부분의 경우 ES6 모듈의 **`import`**/**`export`** 문을 기반으로 합니다.
3. **코드 제거**: 식별된 불필요한 코드를 최종 번들에서 제거합니다. 이 단계에서 실제로 사용 되지 않는 코드가 최종적으로 생성되는 파일에서 제외되어, 결과적으로 파일 크기가 줄어듭니다.
4. **최적화 및 재구성**: 코드 제거 후, 번들러는 남은 코드를 최적화하고 재구성할 수 있습니다. 예를 들어, 코드를 더 효율적으로 재배치하거나, 필요한 경우 다른 모듈과 합치는 등의 작업을 수행할 수 있습니다.

기본적인 트리쉐이킹의 동작은 위와 같지만 세부 구현은 번들러마다 조금씩 다르다. 아래 글에서는 Rollup과 Webpack의 트리쉐이킹이 어떤식으로 구현 되어 있는지 알아볼 것이다.

---

### Rollup의 Tree-Shaking

`rollup`의 트리 쉐이킹은 불필요한 번들을 제거하는 방식이 아니라, 최종 번들 파일에서 포함되어야 한다고 판단된 모듈을 포함하는 원리로 수행된다는 점이 특징이다. (롤업을 만든 Rich Harris이 [트리 쉐이킹과 죽은 코드 제거와의 차이점에 대해서 글](https://medium.com/@Rich_Harris/tree-shaking-versus-dead-code-elimination-d3765df85c80)도 써두었으니 한번 읽어보기를 추천한다.)

`rollup`의 번들링 과정은 의존성 관계를 파악하여 그래프를 생성하고, 이 그래프를 AST(Abstract Syntax Tree)로 치환하여 구문 분석 후 옵션에 맞게 결과물을 만드는 과정으로 이루어진다.

AST는 여러 타입의 Node로 이루어지고 이 Node를 구성하는 [NodeBase를 코드](https://github.com/rollup/rollup/blob/master/src/ast/nodes/shared/Node.ts#L129)로 살펴보면 다음과 같이 **`ExpressionEntity`** 클래스를 상속(extends) 받고, **`ExpressionNode`** 인터페이스를 구현(implements)한다는 것을 알 수 있다.

```typescript
export class NodeBase extends ExpressionEntity implements ExpressionNode {
  declare annotations?: RollupAnnotation[];
  declare end: number;
  parent: Node | { context: AstContext; type: string };
  declare scope: ChildScope;
  declare start: number;
  declare type: keyof typeof NodeType;

  // 내부구현 생략
}

export { NodeBase as StatementBase };
```

이어서 NodeBase가 상속 받는 [ExpressionEntity의 코드](https://github.com/rollup/rollup/blob/master/src/ast/nodes/shared/Expression.ts#L29)를 살펴보면 다음과 같다.

```typescript
export class ExpressionEntity implements WritableEntity {
  protected flags: number = 0;

  get included(): boolean {
    return isFlagSet(this.flags, Flag.included);
  }
  set included(value: boolean) {
    this.flags = setFlag(this.flags, Flag.included, value);
  }

  deoptimizeArgumentsOnInteractionAtPath(
    interaction: NodeInteraction,
    _path: ObjectPath,
    _recursionTracker: PathTracker,
  ): void {
    deoptimizeInteraction(interaction);
  }

  deoptimizePath(_path: ObjectPath): void {}

  /**
   * If possible it returns a stringifyable literal value for this node that
   * can be used for inlining or comparing values. Otherwise, it should return
   * UnknownValue.
   */
  getLiteralValueAtPath(
    _path: ObjectPath,
    _recursionTracker: PathTracker,
    _origin: DeoptimizableEntity,
  ): LiteralValueOrUnknown {
    return UnknownValue;
  }

  getReturnExpressionWhenCalledAtPath(
    _path: ObjectPath,
    _interaction: NodeInteractionCalled,
    _recursionTracker: PathTracker,
    _origin: DeoptimizableEntity,
  ): [expression: ExpressionEntity, isPure: boolean] {
    return UNKNOWN_RETURN_EXPRESSION;
  }

  hasEffectsOnInteractionAtPath(
    _path: ObjectPath,
    _interaction: NodeInteraction,
    _context: HasEffectsContext,
  ): boolean {
    return true;
  }

  include(
    _context: InclusionContext,
    _includeChildrenRecursively: IncludeChildren,
    _options?: InclusionOptions,
  ): void {
    this.included = true;
  }

  includeCallArguments(
    context: InclusionContext,
    parameters: readonly (ExpressionEntity | SpreadElement)[],
  ): void {
    for (const argument of parameters) {
      argument.include(context, false);
    }
  }

  shouldBeIncluded(_context: InclusionContext): boolean {
    return true;
  }
}
```

위 코드에서 눈 여겨 봐야할 것은 바로 `included`값과 `include 메서드`이다.

#### **`included` 속성 (getter 및 setter)**

`included` 속성은 getter와 setter를 통해 관리된다. 이 속성은 노드가 최종 번들에 포함되어야 하는지 여부를 나타내는 불리언 값이다.

- **Getter**: `included`의 getter는 노드의 `flags`필드에 설정된 `Flag.included` 플래그를 확인하여, 노드가 포함된 상태인지 여부를 반환한다.

```typescript
get included(): boolean {
    return isFlagSet(this.flags, Flag.included);
}
```

- **Setter**: `included`의 setter는 주어진 값에 따라 `Flag.included` 플래그를 flags 필드에 설정하거나 해제한다. 이를 통해 노드의 포함 상태를 업데이트할 수 있다.

```typescript
set included(value: boolean) {
    this.flags = setFlag(this.flags, Flag.included, value);
}
```

#### `include` 메소드

`include` 메소드는 특정 표현식 노드가 최종 번들에 포함되어야 할 때 호출된다. 이 메소드는 노드를 "**포함된 상태(included state)**"로 표시한다. 트리 쉐이킹 과정에서 노드가 실행 흐름에 영향을 미치거나 부수 효과(side effects)를 가지는 경우에 이 메소드가 호출되어 **`included`** 속성을 `true`로 설정하고, 해당 노드가 최종 번들에 포함된다.

```typescript
include(_context: InclusionContext, _includeChildrenRecursively: IncludeChildren, _options?: InclusionOptions): void {
    this.included = true;
}
```

#### 정리해보면

`ExpressionEntity`의 `include` 메소드와 `included` 속성은 Rollup의 트리 쉐이킹 과정에서 핵심적인 역할을 한다는 것을 알 수 있다. `include` 메소드를 통해 명시적으로 노드를 포함시키고, **`included`** 속성을 통해 노드의 포함 상태를 관리함으로써, 필요한 코드만 최종 번들에 포함시키는 최적화를 수행할 수 있게 되는 것이다.

이를 위해 Rollup에는 각 AST모듈에는 코드블록이 포함되는 경우 `included`값을 true로 설정하고 현재 코드블록의 모든 es노드를 순회하여 필요한 조건에 따라 `included`값을 결정하는 코드가 공통적으로 구현되어 있다.

---

### Webpack의 Tree-Shaking

- 애플리케이션 항목 파일 식별(Webpack 구성에서 결정됨)
- 항목 파일에서 가져온 모든 종속성과 하위 종속성을 반복하여 애플리케이션 모듈 트리를 만듭니다.
- 내보내기 문을 다른 모듈에서 가져오지 않는 트리의 각 모듈을 식별합니다.
- UglifyJS 또는 Terser와 같은 축소 도구를 사용하여 사용되지 않는 내보내기 및 관련 코드를 제거합니다.

Webpack에서는 `production` 모드에서 `ModuleConcatenationPlugin` 기능이 활성화 되면서 트리쉐이킹이 자동으로 수행된다. 다르게 말하자면 development 모드에서는 최대한의 트리쉐이킹이 적용되지 않으니 이 점을 참고할 필요가 있다. (`ModuleConcatenationPlugin`은 클로저를 활용해 모듈 범위를 동일한 스코프로 감싸고 내보낸 모듈에 동일한 함수명이 존재하는 경우 중복되지 않는 이름으로 변경하는 기능으로 트리쉐이킹을 위해서 선행되어야 하는 동작이다.)

 <br/>

[Webpack은 트리쉐이킹을 최적화 하는 방법을 크게 두 가지로 나누어 소개](https://webpack.kr/guides/tree-shaking/)하고 있는데 바로 `sideEffects`와 `usedExports`이다.

- **usedExports:** 사용된 export만을 추출하여 번들링.
- **sideEffects:** 사용되지 않았고, sideEffects가 없는 모듈은 건너뛴다.

#### usedExport

`usedExports`는 Webpack config에서 [`optimization.usedExports`](https://webpack.kr/configuration/optimization/#optimizationusedexports)로 설정할 수 있으며 기본값이 true이다. 이는 사용되는 exports만 추출해 번들링에 포함한다는 뜻이며 webpack이 기본적으로 제공하는 트리쉐이킹 방식이라고 볼 수 있다.

그러나 development 모드에서는 `usedExports`가 true여도 사용하지 않는 export를 주석으로 표시할 뿐 실제로 코드를 제거 하지는 않으며, 실제로 번들링에서 사용하지 않는 export가 제거된 모습을 보고 싶다면 production 모드로 번들링하거나, `minimize: true` 옵션을 켜 주어야 하니 참고하자.

아래의 코드를 통해 development 모드에서 `usedExports` 옵션이 어떻게 동작 하는지 살펴 볼 것이다. 일단 userAccount 함수가 존재하고

```typescript
// src/userAccount.js

export const userAccount = {
  name: "user account",
};
```

index.js에서 import한 `userAccount`를 `getUserAccount`에서 사용한다.

```typescript
// src/index.js

import { userAccount } from "./userAccount.js";

const getUserName = () => "John Doe";

const getUserPhoneNumber = () => "***********";

const getUserAccount = () => userAccount;

export { getUserName, getUserPhoneNumber, getUserAccount };
```

User-app(어플리케이션)에서 `getUserAccount`를 사용하지 않은 채로 빌드를 하게 되면 다음과 같은 결과물이 나온다.

```typescript
/*!*************************************************!*\
  !*** ./node_modules/user-library/dist/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getUserName": () => /* binding */ getUserName
/* harmony export */ });
/* unused harmony exports getUserAccount, getUserPhoneNumber */
/* harmony import */ var _userAccount_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userAccount.js */ "./node_modules/user-library/dist/userAccount.js");

const getUserName = () => 'John Doe';

const getUserPhoneNumber = () => '***********';

const getUserAccount = () => userAccount;

/***/ }),
/***/ "./node_modules/user-library/dist/userAccount.js":
/*!*******************************************************!*\
  !*** ./node_modules/user-library/dist/userAccount.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony export userAccount */
const userAccount = {
	name: 'user account'
};
/***/ })
```

`getUserAccount`, `getUserPhoneNumber` 그리고 `userAccount`에 **/\* unused harmony export ...** 와 같은 주석이 달려 있음을 확인할 수 있다. 이렇게 표시된 Dead code 들은 production 빌드에서는 삭제되어 번들링에 포함되지 않게 된다. Webpack은 어떻게 사용되지 않는 코드를 찾아내 제거 할 수 있는 것일까?

Webpack은 엔트리 파일에서 부터 재귀적으로 동작하여 모든 모듈을 검토하고 사용 되지 않는 export를 파악한다. 또한 내부 그래프를 통해 `index.js`에 import된 `userAccount`가 `getUserAccount`와 연결되어 있음을 알 수 있다. 따라서 모듈 분석을 통해 이를 통해 `getUserAccount`가 사용 되지 않는다는 것을 알게 되면 이와 연결된 `userAccount` 파일을 찾아가 해당 모듈을 확인하고 거기서 분석 작업을 수행한다.

`usedExports` 만을 필터링 하는 과정은 Terser에 의존해 실행 되며 이것은 단순한 과정은 아니다.

#### SideEffects

Webpack에서는 `sideEffects` 구성을 통해 direct export를 사용하지 않고 사이드 이펙트가 없는 파일(모듈 및 해당 종속성) 전체를 번들 파일에서 제외할 수 있다.

사이드 이펙트를 가진 코드란 전역 변수 또는 해당 범위 외부의 데이터를 사용하는 코드를 말한다. 예를 들어, 동일한 입력에 대해 다른 출력을 반환할 수 있는 함수 또는 `window` 객체와 같은 전역 변수를 변경하거나 HTTP 호출, 파일 시스템, DOM 등의 데이터를 사용하는 함수가 이에 해당한다.

또는 다음과 같은 경우도 사이드 이펙트가 있는 모듈이라고 볼 수 있다.

```typescript
import "fooPolyfill";
import "bar.css";
```

위 모듈들은 import 하는 즉시 어플리케이션에 영향을 미치므로 확실히 sideEffect가 존재한다. 하지만 번들러 관점에서는 `fooPolyfill` , `bar.css`모듈이 import 선언만 되어있고 직접적으로 사용하거나 다시 export하지 않으므로 트리쉐이킹 되어야 하는 모듈로 볼 것이다.

그러나 두 모듈이 사라지면 어플리케이션이 제대로 동작하지 않게 된다. 따라서, Webpack과 Rollup 같은 번들러는 어플리케이션의 안전한 동작을 보장하기 위해 기본적으로 라이브러리의 모든 모듈이 **“sideEffect가 있다.”** 고 판단한다.

Webpack은 사이드 이펙트가 존재함을 전제로, 자체적으로 모듈을 순회하며 모든 모듈의 사이드 이펙트 여부를 체크하지만 이것이 완벽하다고 보기는 어렵다. 오히려 모듈의 사이드이펙트 여부를 완벽하게 판단할 수 있는 것은 개발자 본인이다. 따라서 개발자는 `package.json`이나 webpack config.js에 사이드 이펙트가 있는 파일을 직접 나열하거나, 전체 모듈에 대해 사이트 이펙트가 있는지 없는지 여부를 boolean 값으로 표시하여 트리쉐이킹을 도울 수 있다.

특히 sideEffects가 없는 파일을 명시적으로 표기해주면 해당 파일에 `usedExport`가 없을 경우 전체 모듈/파일 및 전체 하위 트리를 **건너뛸 수 있으므로 빌드나 컴파일 속도 면에서 효과적이다.**

어떻게 속도면에서 효과적일 수 있는지 `usedExport`에서 사용했던 코드 예제를 다시 예로 들어 설명해보자면, Webpack은 재귀적으로 모듈을 분석하다가 `getUserAccount`가 사용되지 않음을 확인한 뒤, `getUserAccount`에 연결된 `userAccount` 모듈을 찾아가 분석을 시작할 것이다. 그러나 이때 `userAccount` 모듈이 sideEffects가 없음을 명시해준다면 Webpack은 `userAccount` 모듈이 사이드 이펙트가 없고 `usedExport` 도 없는 파일임을 인식하고 해당 모듈 및 하위 트리 전체에 대한 분석을 건너 뛴다. 건너 뛸 수 있는 모듈의 크기가 클 수록 빌드(컴파일)속도는 빨라질 것이다.

#### 정리

다시 한번 Webpack의 Tree Shaking에 영향을 주는 두 요소를 정리해보면,

- **usedExports:** 사용된 export만을 추출하여 번들링.
- **sideEffects:** 사용되지 않았고, sideEffects가 없는 모듈은 건너뛴다 (번들에서 제거).

`usedExports`결과가 정확하다면, `sideEffects`에 대한 판단없이도 최종 번들에 포함되는 코드는 동일할 것이다. 그러나 어플리케이션에서 어떤 모듈이 사용되었는지 판단하는 것은 어플리케이션 크기가 조금만 커져도 복잡한 일이 되고 판단이 정확하지 않을 수 있다. 그렇기 때문에 `sideEffects`에 대한 판단을 더하는 것이 훨씬 효율적이고 효과적이며, 두 개의 결과를 종합하면 최적의 트리 쉐이킹 결과를 얻을 수 있다.

---

## 왜 ESM로 쓰여진 라이브러리가 트리쉐이킹에 더 적합한 것일까?

이제 트리쉐이킹이 어떤 원리와 과정을 통해 구현 되는지는 알게 되었다. 하지만 아직 답하지 못한 질문이 있다. 왜 왜 ESM로 쓰여진 라이브러리가 트리쉐이킹에 더 적합한 것일까?

결론부터 이야기 하자면 번들러마다 트리쉐이킹의 내부 원리는 조금씩 다를 수 있지만, **'정적분석이 가능한 구조에 대해 더 잘 지원할 수 있다.'** 는 사실은 동일하기 때문이다.

좀 더 잘 이해하기 위해서는 ESM과 CJS 각 모듈 시스템의 특징에 대해서 알아야 한다. **둘 사이의 큰 차이점 중 하나는 ESM의 가져오기가 정적인 반면 CJS의 가져오기는 동적이라는 점이다.** 즉, CJS로는 다음과 같은 작업을 수행할 수 있지만 ESM으로는 수행할 수 없다:

```tsx
if (someCondition) {
  const { userAccount } = require("./userAccount");
}
```

이는 더 유연해 보이지만, 번들러가 컴파일 또는 빌드 시간에 유효한 어플리케이션 트리를 만들 수 없음을 의미한다. 위에 코드로 보면 someCondition 변수의 값은 런타임에 정해지지만 번들러는 컴파일(빌드) 시간에 `userAccount`를 포함할지 말지 여부를 정해야 한다. 이로 인해 번들러는 실제로 import가 사용되는지 확신할 수 없기 때문에 모든 CJS 스타일 import를 번들에 직접 포함하게 된다.

---

## 마치며

이제는 도입부에서 언급 했던 질문들에 대해 모두 답할 수 있을 것 같다.

- **트리쉐이킹을 지원하고/하지 않고는 어디서 결정되는 것인가?**
  트리쉐이킹은 번들러에 의해 수행된다. 단 트리쉐이킹에 대한 전제조건으로 ESM으로 작성된 코드여야 하며 CJS로 작성된 코드라면 빌드(컴파일) 과정에서 ESM으로 변환하는 등의 추가적인 설정이 필요하다.
- **어떻게 해야 트리쉐이킹을 지원하는 라이브러리를 만들 수 있는 것인가?**
  MyApp 서비스에 A라는 라이브러리를 사용한다고 가정하고, MyApp 빌드 시에 A 라이브러리의 코드가 트리쉐이킹 되길 원한다면 라이브러리의 결과물이 ESM으로 작성되어야 한다. 추가적으로 MyApp 빌드 시에 sideEffects 이점를 최대한으로 적용하고 싶다면 라이브러리의 결과물이 여러 개의 작은 파일로 번들링 되는 편이 효과적이다. A 라이브러리가 하나의 파일로 번들링 되어 있다면, 건너뛸 수 있는 모듈/파일이 없게 되므로 sideEffects 최적화의 이점을 누릴 수 없다.
- **왜 ES6 구문으로 쓰여진 lodash-es는 트리쉐이킹에 더 용이한 것일까?**
  트리쉐이킹은 정적 분석이 가능한 구조에 대해 더 잘 지원할 수 있으며, CJS의 가져오기는 동적인 반면 ESM의 가져오기는 정적이기 때문.

### 정리해보자면

- 트리 셰이킹이란 자바스크립트 컨텍스트에서 데드 코드 제거를 설명하는 용어로 **번들러에 의해 수행된**다.
- 각 번들러에 따라 트리셰이킹을 구현하는 내부 원리는 조금씩 다를 수 있지만, 기본적으로 **1)** 모듈을 추상구문트리 형태로 시각화하여 서로 간의 의존성을 분석 **2)** 의존성 분석 결과를 바탕으로, 사용되지 않는 코드를 식별 **3)** 식별한 불필요한 코드 제거의 형태로 이루어진다.
- 위에서 언급한 트리쉐이킹의 과정 중에서 각 모듈 간의 의존성을 분석하는 **정적 분석이 필요하기 때문**에 정적분석이 어려운 CJS로 작성된 코드는 적합하지 않다. 트리쉐이킹을 지원하고 싶다면 **ESM으로 작성**해야 한다.

정리하고 보니 다소 간단(?)해보이지만 이 글을 작성하기 위해 트리쉐이킹과 관련한 많은 글을 읽으며 이 세계가 그리 녹록치만은 않다는 걸 느꼈다. 실제 코드를 작성하며 트리쉐이킹을 최대한으로 활용하고 싶다면 베럴 파일과 CSS의 트리쉐이킹 그리고 라이브러리와 트리쉐이킹 등 디테일하게 알아야 할 부분들이 상당히 많다. 시간이 된다면 관련한 부분에 대해서 추가적인 정리를 해보아야겠다. (과연?)

---

### 참고자료

- [How to make Tree Shakable libraries](https://blog.theodo.com/2021/04/library-tree-shaking/)
- [Tree shaking? Let’s implement it!](https://medium.com/punching-performance/tree-shaking-lets-implement-it-8de1c29f49e9)
- [Tree Shaking in Webpack](https://dev.to/fogel/tree-shaking-in-webpack-5apj)
- [Reduce javascript payloads with tree shaking](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking?hl=ko)
- [Tree Shaking VS Dead code elimination](https://medium.com/@Rich_Harris/tree-shaking-versus-dead-code-elimination-d3765df85c80)
- [Tree-Shaking a react component library in rollup](https://www.codefeetime.com/post/tree-shaking-a-react-component-library-in-rollup/)
- [Tree Shaking in javascript bundlers](https://javascript.plainenglish.io/tree-shaking-in-javascript-bundlers-cf5c9583b13d)
- [Webpack 5, 무엇이 달라졌을까?](https://so-so.dev/tool/webpack/whats-different-in-webpack5/)
- [번들러와 모듈 시스템](https://jinyisland.kr/post/bundle-and-module/)
- [Tree Shaking 과 Module System](https://so-so.dev/web/tree-shaking-module-system/)
