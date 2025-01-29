import { useEffect, useState } from "react";

export type StatefulResponse<T> =
  | {
      data: T;
      state: "loaded";
    }
  | {
      data: undefined;
      state: "error";
      errorMessage: string;
    }
  | {
      data: undefined;
      state: "loading";
    }
  | {
      data: undefined;
      state: "no-url";
    };

export const useJsonUrl = <T>(url: string | undefined): StatefulResponse<T> => {
  const [response, setResponse] = useState<StatefulResponse<T>>({
    data: undefined,
    state: "loading",
  });

  useEffect(() => {
    const fetchData = async (u: string) => {
      try {
        const res = await fetch(u);
        const json = await res.json();
        setResponse({ data: json, state: "loaded" });
      } catch (error) {
        setResponse({
          data: undefined,
          state: "error",
          errorMessage: `${error}`,
        });
      }
    };
    if (url) {
      fetchData(url);
    } else {
      setResponse({ data: undefined, state: "no-url" });
    }
  }, [url]);

  return response;
};
