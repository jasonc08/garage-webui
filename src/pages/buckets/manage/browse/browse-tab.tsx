import { useSearchParams } from "react-router-dom";
import { Card } from "react-daisyui";
import ObjectList from "./object-list";
import ShareDialog from "./share-dialog";
import { useEffect, useState } from "react";
import ObjectListNavigator from "./object-list-navigator";
import Actions from "./actions";
import { useBucketContext } from "../context";

const getInitialPrefixes = (searchParams: URLSearchParams) => {
  const prefix = searchParams.get("prefix");
  if (prefix) {
    const paths = prefix.split("/").filter((p) => p);
    return paths.map((_, i) => paths.slice(0, i + 1).join("/") + "/");
  }
  return [];
};

const BrowseTab = () => {
  const { bucket } = useBucketContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prefixHistory, setPrefixHistory] = useState<string[]>(
    getInitialPrefixes(searchParams)
  );
  const [curPrefix, setCurPrefix] = useState(prefixHistory.length - 1);
  const [inputValue, setInputValue] = useState<string>("");
  const [searchPrefix, setSearchPrefix] = useState<string | null>(null);
  const [searchTimeoutRef, setSearchTimeoutRef] = useState<NodeJS.Timeout | null>(null);

  const effectivePrefix = searchPrefix ?? (prefixHistory[curPrefix] ?? "");

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    if (searchTimeoutRef) {
      clearTimeout(searchTimeoutRef);
    }
    if (value === "") {
      setSearchPrefix(null);
      return;
    }
    const timeout = setTimeout(() => {
      setSearchPrefix(value);
    }, 300);
    setSearchTimeoutRef(timeout);
  };

  const handleHomeClick = () => {
    setPrefixHistory([]);
    setCurPrefix(-1);
    setSearchPrefix(null);
    setInputValue("");
  };

  useEffect(() => {
    const prefix = effectivePrefix;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("prefix", prefix);
    setSearchParams(newParams);
  }, [effectivePrefix]);

  const gotoPrefix = (prefix: string) => {
    const history = prefixHistory.slice(0, curPrefix + 1);
    setPrefixHistory([...history, prefix]);
    setCurPrefix(history.length);
    setSearchPrefix(null);
    setInputValue("");
  };

  if (!bucket.keys.find((k) => k.permissions.read && k.permissions.write)) {
    return (
      <div className="p-4 min-h-[200px] flex flex-col items-center justify-center">
        <p className="text-center max-w-sm">
          You need to add a key with read & write access to your bucket to be
          able to browse it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Card className="pb-2">
        <div className="flex flex-row flex-wrap items-center p-2 gap-y-2">
          <div className="flex items-center w-full">
            <input
              type="text"
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-1 border border-neutral-300 rounded"
            />
          </div>
        </div>

        <ObjectListNavigator
          curPrefix={curPrefix}
          setCurPrefix={setCurPrefix}
          prefixHistory={prefixHistory}
          onHomeClick={handleHomeClick}
          actions={<Actions prefix={effectivePrefix} />}
        />

        <ObjectList
          prefix={effectivePrefix}
          onPrefixChange={gotoPrefix}
        />
      </Card>
      <ShareDialog />
    </div>
  );
};

export default BrowseTab;
