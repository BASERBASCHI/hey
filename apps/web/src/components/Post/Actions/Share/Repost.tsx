import { useApolloClient } from "@apollo/client";
import { MenuItem } from "@headlessui/react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { ERRORS } from "@hey/data/errors";
import { type PostFragment, useRepostMutation } from "@hey/indexer";
import type { ApolloClientError } from "@hey/types/errors";
import { useCounter } from "@uidotdev/usehooks";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface RepostProps {
  isSubmitting: boolean;
  post: PostFragment;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
}

const Repost = ({ isSubmitting, post, setIsSubmitting }: RepostProps) => {
  const { currentAccount } = useAccountStore();
  const hasReposted =
    post.operations?.hasReposted.optimistic ||
    post.operations?.hasReposted.onChain;
  const [shares, { increment }] = useCounter(
    post.stats.reposts + post.stats.quotes
  );
  const { cache } = useApolloClient();
  const handleTransactionLifecycle = useTransactionLifecycle();

  const updateCache = () => {
    if (!post.operations) {
      return;
    }

    cache.modify({
      fields: {
        hasReposted: (existingValue) => {
          return { ...existingValue, optimistic: true };
        }
      },
      id: cache.identify(post.operations)
    });
    cache.modify({
      fields: {
        stats: (existingData) => ({
          ...existingData,
          reposts: shares + 1
        })
      },
      id: cache.identify(post)
    });
  };

  const onCompleted = () => {
    setIsSubmitting(false);
    increment();
    updateCache();
    toast.success("Post has been reposted!");
  };

  const onError = (error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  };

  const [repost] = useRepostMutation({
    onCompleted: async ({ repost }) => {
      if (repost.__typename === "PostResponse") {
        return onCompleted();
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: repost
      });
    },
    onError
  });

  const handleCreateRepost = async () => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }

    setIsSubmitting(true);

    return await repost({ variables: { request: { post: post.id } } });
  };

  return (
    <MenuItem
      as="div"
      className={({ focus }) =>
        cn(
          { "dropdown-active": focus },
          "m-2 block cursor-pointer rounded-lg px-4 py-1.5 text-sm"
        )
      }
      disabled={isSubmitting}
      onClick={handleCreateRepost}
    >
      <div className="flex items-center space-x-2">
        <ArrowsRightLeftIcon className="size-4" />
        <div>{hasReposted ? "Repost again" : "Repost"}</div>
      </div>
    </MenuItem>
  );
};

export default Repost;
