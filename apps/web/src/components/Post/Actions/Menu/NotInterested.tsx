import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";
import { MenuItem } from "@headlessui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  type PostFragment,
  type PostNotInterestedRequest,
  useAddPostNotInterestedMutation,
  useUndoPostNotInterestedMutation
} from "@hey/indexer";
import type { ApolloClientError } from "@hey/types/errors";
import { toast } from "sonner";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import stopEventPropagation from "@/helpers/stopEventPropagation";

interface NotInterestedProps {
  post: PostFragment;
}

const NotInterested = ({ post }: NotInterestedProps) => {
  const notInterested = post.operations?.isNotInterested;

  const request: PostNotInterestedRequest = {
    post: post.id
  };

  const updateCache = (
    cache: ApolloCache<NormalizedCacheObject>,
    notInterested: boolean
  ) => {
    if (!post.operations) {
      return;
    }

    cache.modify({
      fields: { isNotInterested: () => notInterested },
      id: cache.identify(post.operations)
    });
  };

  const onError = (error: ApolloClientError) => {
    errorToast(error);
  };

  const [addPostNotInterested] = useAddPostNotInterestedMutation({
    onCompleted: () => toast.success("Marked as not Interested"),
    onError,
    update: (cache) => updateCache(cache, true),
    variables: { request }
  });

  const [undoPostNotInterested] = useUndoPostNotInterestedMutation({
    onCompleted: () => toast.success("Undo Not interested"),
    onError,
    update: (cache) => updateCache(cache, false),
    variables: { request }
  });

  const handleToggleNotInterested = async () => {
    if (notInterested) {
      return await undoPostNotInterested();
    }

    return await addPostNotInterested();
  };

  return (
    <MenuItem
      as="div"
      className={({ focus }) =>
        cn(
          { "dropdown-active": focus },
          "m-2 block cursor-pointer rounded-lg px-2 py-1.5 text-sm"
        )
      }
      onClick={(event) => {
        stopEventPropagation(event);
        handleToggleNotInterested();
      }}
    >
      <div className="flex items-center space-x-2">
        {notInterested ? (
          <>
            <EyeIcon className="size-4" />
            <div>Undo Not interested</div>
          </>
        ) : (
          <>
            <EyeSlashIcon className="size-4" />
            <div>Not interested</div>
          </>
        )}
      </div>
    </MenuItem>
  );
};

export default NotInterested;
