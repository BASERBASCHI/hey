import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { ERRORS } from "@hey/data/errors";
import {
  type PostFragment,
  PostReactionType,
  useAddReactionMutation,
  useUndoReactionMutation
} from "@hey/indexer";
import type { ApolloClientError } from "@hey/types/errors";
import { useCounter, useToggle } from "@uidotdev/usehooks";
import { AnimateNumber } from "motion-plus-react";
import { toast } from "sonner";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface LikeProps {
  post: PostFragment;
  showCount: boolean;
}

const Like = ({ post, showCount }: LikeProps) => {
  const { currentAccount } = useAccountStore();

  const [hasReacted, toggleReact] = useToggle(post.operations?.hasReacted);
  const [reactions, { decrement, increment }] = useCounter(
    post.stats.reactions
  );

  const updateCache = (cache: ApolloCache<NormalizedCacheObject>) => {
    if (!post.operations) {
      return;
    }

    cache.modify({
      fields: { hasReacted: () => !hasReacted },
      id: cache.identify(post.operations)
    });

    cache.modify({
      fields: {
        stats: (existingData) => ({
          ...existingData,
          reactions: hasReacted ? reactions - 1 : reactions + 1
        })
      },
      id: cache.identify(post)
    });
  };

  const onError = (error: ApolloClientError) => {
    errorToast(error);
  };

  const [addReaction] = useAddReactionMutation({
    onError: (error) => {
      toggleReact();
      decrement();
      onError(error);
    },
    update: updateCache
  });

  const [undoReaction] = useUndoReactionMutation({
    onError: (error) => {
      toggleReact();
      increment();
      onError(error);
    },
    update: updateCache
  });

  const handleCreateLike = async () => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }

    toggleReact();

    if (hasReacted) {
      decrement();
      return await undoReaction({
        variables: {
          request: { post: post.id, reaction: PostReactionType.Upvote }
        }
      });
    }

    increment();
    return await addReaction({
      variables: {
        request: { post: post.id, reaction: PostReactionType.Upvote }
      }
    });
  };

  const iconClassName = showCount
    ? "w-[17px] sm:w-[20px]"
    : "w-[15px] sm:w-[18px]";

  return (
    <div
      className={cn(
        hasReacted ? "text-brand-500" : "text-gray-500 dark:text-gray-200",
        "flex items-center space-x-1"
      )}
    >
      <button
        aria-label="Like"
        className={cn(
          hasReacted ? "hover:bg-brand-300/20" : "hover:bg-gray-300/20",
          "rounded-full p-1.5 outline-offset-2"
        )}
        onClick={handleCreateLike}
        type="button"
      >
        <Tooltip
          content={hasReacted ? "Unlike" : "Like"}
          placement="top"
          withDelay
        >
          {hasReacted ? (
            <HeartIconSolid className={iconClassName} />
          ) : (
            <HeartIcon className={iconClassName} />
          )}
        </Tooltip>
      </button>
      {reactions > 0 && !showCount ? (
        <AnimateNumber
          className="w-3 text-[11px] sm:text-xs"
          format={{ notation: "compact" }}
          key={`like-count-${post.id}`}
          transition={{ type: "tween" }}
        >
          {reactions}
        </AnimateNumber>
      ) : null}
    </div>
  );
};

export default Like;
