---
title: React Query를 왜 그리고 어떻게 써야할까?
date: "2023-04-16"
template: "post"
draft: true
slug: "/posts/Why-and-how-should-I-use-React-Query"
category: "Tech"
description: "우리 그냥 쓰진 말자구 😋"
---

사내 프로젝트에 React Query 도입을 추진하며 팀원들에게 공유했던 글을 블로그에도 올려본다. 이 글을 작성하며 스스로 정리도 많이 되었고 새로운 기술 도입에 있어서 '그냥 좋으니까 쓰자'가 아닌 근거있는 제안을 할 수 있게 되어서 좋았던 경험이었다.


## 우리가 이제껏 서버 데이터를 다루는 방식은요 🫢
1. 서버로부터 데이터를 받아온다
2. State에 값을 저장하고 해당 값을 이용해 화면을 렌더링 한다.
3. 전역적으로 필요한 값의 경우에는 State가 아닌 전역상태관리(Ex. Redux, mobx, recoil 등)의 Store에 저장하여 값을 다룬다.
4. 필요에 따라 State(또는 store)에 담긴 상태 값을 업데이트하며 사용한다.

## 이제껏 이렇게 잘 써왔는데 무슨 문제가 있을까 🤔?

### 1. Single Source of Truth

> **For each unique piece of state, you will choose the component that “owns” it.** This principle is also known as having a [“single source of truth”.](https://en.wikipedia.org/wiki/Single_source_of_truth) It doesn’t mean that all state lives in one place—but that for *each* piece of state, there is a *specific* component that holds that piece of information. Instead of duplicating shared state between components, *lift it up* to their common shared parent, and *pass it down* to the children that need it.
> 

https://react.dev/learn/sharing-state-between-components

리액트는 각 각의 상태값이 **단일한 정보의 원천(Single Source of Truth)** 이 될 것을 권장한다. 그러나 이 원칙은 자칫 잘못하면 어그러지기 십상이다. 구체적인 예를 들어보겠다. A 컴포넌트와 B 컴포넌트에서 동일하게 유저의 정보가 필요하다고 하자. 만약에 A와 B 컴포넌트에게 공통의 부모가 있다면 우리는 그 부모 컴포넌트에서 유저의 정보를 받아와 A와 B 컴포넌트에 props로 필요한 유저 정보를 내려줄 것이다. 

그런데 만약 두 컴포넌트 사이 공통의 부모 컴포넌트가 없다면? 그리고 무지성으로 A와 B 컴포넌트 각 각 유저정보를 호출하여 각자의 state에 담아 사용한다면? 그 순간 Single Source of Truth의 원칙은 깨지고 만다. 이 상태에서 더 나아가 각 각의 컴포넌트에서 유저 정보를 다른 형태로 업데이트하여 사용한다면, 과연 어떤 데이터가 가장 최신화된 현재의 상태 값인지를 신뢰하기 힘들어지게 된다.

그래서 우리는 Single Source of Truth와 같은 원칙을 지키고, props drilling과 같은 불편함을 없애기 위해 전역상태관리 시스템을 사용하게 된다. 서버의 데이터를 받아와 store에 저장해 놓고 어떤 컴포넌트이던 store의 값을 참조하게 되면 store라는 단일한 정보의 원천을 바라보게 되는 것이다. 

**아니 그런데 잠깐! 이것으로 진짜 Single Source of Truth의 원칙이 지켜졌다고 볼 수 있을까?** 

서버 데이터(Server state)가 서버를 떠나 클라이언트의 store(혹은 state)에 저장되는 순간 이 데이터는 원본이 아니라 서버 데이터의 복사본일 뿐이며 클라이언트의 상태 값으로 바뀌게 된다. 결국은 복사본이 되었다는 점에서 Store를 사용하는 방식도 진정으로 단일한 정보의 원천이 맞는지에 대해 의문이 든다 🧐

### 2. 보일러 플레이트 코드

또한 우리는 전역 상태관리 시스템에서 서버에서 가져온 비동기 데이터를 관리하기 위해 거대한 보일러 플레이트 코드를 작성해야 하기도 했다. 사실 나는 redux를 제대로 써본적이 없어 redux-thunk나 redux-saga를 이용해 비동기를 핸들링하는 코드를 직접 작성해 본 적은 없지만(…) 그 악명에 대해서는 전해들은 바가 많다.
<br /><br />

## 그래서 React-Query는요!

리액트 쿼리는 이러한 기존의 상태값 관리에서 나아가 새로운 관점을 주장한다.

- global state는 client와 Server로 분류할 수 있고, 이 두 state는 다른 방식으로 다뤄져야 효율적인 앱을 만들 수 있다.
- Server state: 서버에서 가져오는 데이터들도 하나의 상태이다!
- Server-State과 Client-State의 구분
    - Client State : 세션간 지속적이지 않는 데이터, 동기적, 클라이언트가 소유, 항상 최신 데이터로 업데이트(렌더링에 반영)
        - ex) 리액트 컴포넌트의 state, 동기적으로 저장되는 redux store의 데이터
    - Server State : 세션간 지속되는 데이터, 비동기적, 세션을 진행하는 클라이언트만 소유하는게 아니고 공유되는 데이터도 존재하며 여러 클라이언트에 의해 수정될 수 있음, 클라이언트에서는 서버 데이터의 스냅샷만을 사용하기 때문에 클라이언트에서 보이는 서버 데이터는 항상 최신임을 보장할 수 없음.
        - ex) 리액트 앱에서는 비동기 요청으로 받아올 수 있는, 백엔드 DB에 저장되어있는 데이터

**이러한 관점을 따른다면 우리는 상태 값을 다음과 같은 형태로 나누어 볼 수 있겠다.**

- Server state: 서버에서 받아오는 데이터
- Client State
    - local(UI) state: Input의 value, Checkbox의 선택 여부(checked), 모달을 숨겼다 보여주는 값 등 하나 또는 여러 개의 컴포넌트에서 다루는 상태 값
    - Global State: 다수의 컴포넌트를 넘나들며 전역적으로 사용되는 상태 값. 전역상태관리의 Store에 담아 이용하는 값들이라고 볼 수 있겠다. ex.다크모드 여부, 고정된 Nav에서 보여져야 하는 상태 값, 로그인 여부 등
    - URL State: URL에 포함된 상태 값. 쿼리 스트링, 쿼리 파라미터 값

## Stale-While-Revalidate 전략

즉 react query는 Server state를 Client state와 분리하여 다룰 수 있게 해주는 툴이며, 보다 효과적으로 Server state를 다루기 위해 `stale-while-revalidate` 전략(캐시 패러다임)을 사용하고 있다.

`stale-while-revalidate` 는 **1) 캐시된 응답이 오래될 수 있다고 가정하는 부분**과 **2) 그 캐시된 응답을 재검증하는 프로세스** 두 부분으로 나뉜다.

```tsx
// HTTP Response Cache-Control Header
Cache-Control: max-age=1, stale-while-revalidate=59
```

- **1) Cache-Control Header의 max-age를 확인**
    - 아직 만료되지 않았으면 → Do nothing
- **2) 만료되었으면 stale-while-revalidate 값을 확인**
    - stale-while-revalidate 값을 넘지 않았다면
        - 일단 캐싱된 값을 반환
        - 동시에 향후 사용을 위해 데이터를 요청하여 최신화
    - 넘었다면
        - 데이터를 새로 요청해서 최신화
<br />

## 써보니 이런게 좋던데요 😋?
- react Query는 서버 상태를 관리하는 레이어 전체를 추상화 시켜 개발자가 관리하는 앱 내의 상태에서 서버 상태를 제외한 UI 상태 에만 집중하여 개발할 수 있도록 했다.
- 특히 비동기 로직을 쉽게 다룰 수 있다. (과거 redux saga같이 장황한 것들을 이용할 필요 없음) 작은 보일러 플레이트 코드로 사용할 수 있다.
<br />

## 중요한 기본사항들

- Query들은 4개의 상태를 가지며, useQuery가 반환하는 객체의 프로퍼티로 어떤 상태인지 확인이 가능하다.
    1. `fresh` : 새롭게 추가된 쿼리 인스턴스 → active 상태의 시작, 기본 staleTime이 0이기 때문에 아무것도 설정을 안해주면 호출이 끝나고 바로 stale 상태로 변한다. staleTime을 늘려줄 경우 fresh한 상태가 유지되는데, 이때는 쿼리가 다시 마운트되도 패칭이 발생하지 않고 기존의 fresh한 값을 반환한다.
    2. `fetching` : 요청을 수행하는 중인 쿼리
    3. `stale` : 인스턴스가 존재하지만 이미 패칭이 완료된 쿼리. 특정 쿼리가 stale된 상태에서 같은 쿼리 마운트를 시도한다면 캐싱된 데이터를 반환하면서 리패칭을 시도한다.
    4. `inactive` : active 인스턴스가 하나도 없는 쿼리. inactive된 이후에도 cacheTime 동안 캐시된 데이터가 유지된다. cacheTime이 지나면 GC된다.
- 어떻게 inactive가 되는가? : 렌더링간에 다시 호출되지 않고 언마운트되는 쿼리들은 inactive가 된다.
- 다음의 경우에 리패칭이 일어난다
    1. 런타임에 stale인 특정 쿼리 인스턴스가 다시 만들어졌을 때 (refetchOnMount 옵션으로 끄고 키는게 가능)
    2. window가 다시 포커스가 되었을 때(refetchOnWindowFocus 옵션으로 끄고 키는게 가능)
    3. 네트워크가 다시 연결 되었을 때(refetchOnReconnect 옵션으로 끄고 키는게 가능)
    4. refetch interval이 있을때 : 요청 실패한 쿼리는 디폴트로 3번 더 백그라운드단에서 요청하며, retry, retryDelay 옵션으로 간격과 횟수를 커스텀 가능하다.
    5. 개발자가 직접 Mutation 등의 작업 이후 queryClient.invalidateQueries 를 사용해 수동으로 쿼리를 무효화 하여 revalidate 했을 때
<br />

## React-query의 라이프사이클

1. 'a' 쿼리 인스턴스가 mount 됨
2. 네트워크에서 데이터 fetching 하고 'a'라는 query key로 캐싱
3. 받아온 데이터는 fresh 상태에서 staleTime (default 0) 이후 stale 상태로 변경
4. 'a' 쿼리 인스턴스가 unmount 되고 쿼리의 상태 값이 inactive로 변경
5. 캐시는 inactive 상태에서 cacheTime (default 5 mins) 만큼 유지되고 그 이후엔 가비지 컬렉팅
6. 만일 cacheTime이 지나기 전에 'a' 쿼리 인스턴스가 새롭게 mount되면 refetching 되고 fresh한 값을 가져오는 동안 캐시된 데이터를 보여줌

cf 1. 쿼리가 언마운트되거나 더 이상 사용하지 않을 때 ⇒ 마지막 인스턴스가 언마운트되어 inactive 상태가 되었을때 5분(cacheTime의 기본값)이 지나면 자동으로 삭제한다.

cf 2. cacheTime은 stateTime과 관계없이 무조건 inactive된 시점을 기준으로 캐시 데이터 삭제.
<br />


## React -query를 좀 더 현명하게 사용하는 방법들

### :: 쉽게 변하지 않는 값을 한번만 받아와서 재 사용하고 싶을 때

행정구역 정보, 국가 리스트 등 거의 변하지 않는 정보들은 처음 한번만 호출한 뒤 캐싱하여 재활용 할 수 있다. 

<aside>
💡 staleTime: infinity, cacheTime: infinity로 설정한다.

</aside>

- staleTime을 inifinity로 설정하게 되면, 데이터를 한번 받아오면 항상 fresh한 것으로 간주된다. cacheTime (default. 5mins) 내에 인스턴스가 언마운트 되었다가 다시 마운트 되면 데이터는 fresh 상태이기 때문에 refetch 하지 않는다.
- 그러나 인스턴스가 언마운트 되고(쿼리가 inactive 상태로 변한다.), cacheTime이 지나면 가비지 컬렉팅 되기 때문에, 이 이후에 다시 마운트되면 refetch 된다.
- 따라서 런타임 내내 처음 한번만 받아와 계속 사용하고 싶다면, staleTime, cacheTime 모두 infinity로 설정하면 된다.
- 쿼리 값은 계속 fresh한 상태이며, cacheTime이 infinity이기 때문에 GC되지 않는다.

### :: Invalidation

- useQuery를 이용해 `queryKey: [’user’]` 의 정보를 받아온다 -> user 정보가 캐싱된다.
- 유저가 닉네임을 변경한다(mutation). -> mutate가 성공하면 유저 정보가 변경되면서 캐싱되어 있던  `queryKey: [’user’]` query의 상태가 stale 하게 변한다.
- 이 경우, useQuery를 이용하여 `queryKey: [’user’]`를 리패칭하려고 시도할 수 있으나 그러지 말고,
- invalidateQueries 메소드를 사용하여 개발자가 명시적으로 query가 stale되는 지점을 지정해 줄 수 있다. 해당 메소드가 호출되면 쿼리가 바로 stale되고, 리패치가 진행된다. Mutation 생명주기(onSuccess 옵션) 내에서 해주면 자연스럽다.

```jsx
import { useMutation, useQueryClient } from 'react-query';

const queryClient = useQueryClient();

// 뮤테이션이 성공한다면, 쿼리의 데이터를 invalidate해 관련된 쿼리가 리패치되도록 만든다.
const mutation = useMutation(addTodo, {
  onSuccess: () => {
    queryClient.invalidateQueries('user');
    queryClient.invalidateQueries('reminders');
  },
});
```

- 또한 mutation으로 요청 후 서버에서 받는 response값이 갱신된 새로운 데이터일 경우도 있다. 이럴때는 mutation을 성공했을 때 쿼리 데이터를 명시적으로 바꿔주는 queryClient 인스턴스의 setQueryData 메소드를 사용하면 좋다.

```jsx
const queryClient = useQueryClient();

const mutation = useMutation(editTodo, {
  onSuccess: (data) => queryClient.setQueryData(['todo', { id: 5 }], data),
});

mutation.mutate({
  id: 5,
  name: 'Do the laundry',
});

// 뮤테이션의 response 값으로 업데이트된 data를 사용할 수 있다.
const { status, data, error } = useQuery(['todo', { id: 5 }], fetchTodoByID);
```

### :: initialData 활용하기

initialData 옵션을 사용하면 **쿼리의 초기 데이터를 설정하고 초기 로딩 상태를 건너 뛸 수 있다**. initialData는 캐시에도 유지되기 때문에, 불완전한 데이터를 제공하지 않는 것이 좋다. 불완전한 데이터의 경우에는 initialData가 아닌 placeholderData 옵션을 이용하자!

다른 쿼리의 캐시된 결과에서 쿼리의 초기 데이터를 제공할 수 있다. 예를 들어 할일 목록 쿼리에서 캐시된 데이터를 검색하여 개별 할일 항목을 찾은 다음 이를 개별 할일 쿼리의 초기 데이터로 사용하는 것을 좋은 예로 들 수 있다. 

```jsx
const result = useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => fetch('/todos'),
  initialData: () => {
    // Use a todo from the 'todos' query as the initial data for this todo query
    return queryClient.getQueryData(['todos'])?.find((d) => d.id === todoId)
  },
})
```

### :: 에러 핸들링

- 전역 onError를 세팅해두면, 에러 발생시 전역 onError에서 Catch된다.
- 그러나 개별의 쿼리(useMutation, useQuery)에서 onError를 세팅해두면 개별 onError 핸들러가 동작하고 해당 에러는 이미 잡혔으므로 상위 스코프로 전파되지 않아, 전역 onError 는 동작하지 않는다.

cf. 그러나 useMutation과 mutate 함수에 onError/onSuccess 핸들러를 각 각 세팅할 경우 두 개의 핸들러는 모두 동작한다. (그 중 useMutation에 설정된 핸들러가 먼저 동작하는 듯…)

### :: 쿼리 키를 의존성 배열로 생각하자

그간 우리는 기본적으로 어떠한 비동기 호출을 명령형에 가까운 방식으로 처리해왔다. 그러나 react-query를 이용하면 `이 비동기 요청은 state가 x인 경우의 결과물이다` 는 식의 선언형으로 호출할 수 있게 된다. 만약 state의 값이 바뀐다면 쿼리 키 배열의 변화를 감지하여 자동으로 새로운 요청을 보낸다.

```tsx
const [state, setState] = useState()
const [data, setData] = useState()

useEffect(() => {
	const res = fetchTodos(state)
	setData(res)
}, [state])
```

```tsx
export const useTodosQuery = (state: State) =>
  useQuery(['todos', state], () => fetchTodos(state))
```

이러한 컨셉을 이해한다면 아래와 같이 `refetch` 가 실행될 상황이나, 함수 인자로 특정 요청에 필요한 id를 넘기지 않게 될 것이다.

```tsx
// 잘못된 예시
const { data, refetch } = useQuery(['item'], () => fetchItem({ id: 1 }))

<button onClick={() => {
  // 🚨 this is not how it works
  refetch({ id: 2 })
}})>Show Item 2</button>
```

데이터 요청이 state(`id`)에 의존하도록 수정하는 것이 맞다.
