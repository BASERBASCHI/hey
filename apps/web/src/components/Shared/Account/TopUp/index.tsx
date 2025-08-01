import { NATIVE_TOKEN_SYMBOL } from "@hey/data/constants";
import { useBalancesBulkQuery } from "@hey/indexer";
import Loader from "@/components/Shared/Loader";
import { Image } from "@/components/Shared/UI";
import getTokenImage from "@/helpers/getTokenImage";
import { useFundModalStore } from "@/store/non-persisted/modal/useFundModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import Transfer from "./Transfer";

const TopUp = () => {
  const { currentAccount } = useAccountStore();
  const { token } = useFundModalStore();
  const { data: balance, loading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount?.address,
    variables: {
      request: {
        address: currentAccount?.address,
        ...(token
          ? { tokens: [token?.contractAddress] }
          : { includeNative: true })
      }
    }
  });

  if (loading) {
    return <Loader className="my-10" message="Loading balance..." />;
  }

  const tokenBalance =
    balance?.balancesBulk[0].__typename === "Erc20Amount"
      ? Number(balance.balancesBulk[0].value).toFixed(2)
      : balance?.balancesBulk[0].__typename === "NativeAmount"
        ? Number(balance.balancesBulk[0].value).toFixed(2)
        : 0;

  return (
    <div className="m-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image
          alt={token?.symbol}
          className="size-12 rounded-full"
          src={getTokenImage(token?.symbol)}
        />
        <div className="font-bold text-2xl">
          {tokenBalance} {token?.symbol ?? NATIVE_TOKEN_SYMBOL}
        </div>
        <div className="text-gray-500 text-sm dark:text-gray-200">
          Top-up your Lens account with{" "}
          <b>{token?.symbol ?? NATIVE_TOKEN_SYMBOL}</b>
        </div>
      </div>
      <Transfer token={token} />
    </div>
  );
};

export default TopUp;
