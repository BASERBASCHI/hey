import { SwatchIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import ToggleWithHelper from "@/components/Shared/ToggleWithHelper";
import errorToast from "@/helpers/errorToast";
import { hono } from "@/helpers/fetcher";
import { usePreferencesStore } from "@/store/persisted/usePreferencesStore";

const IncludeLowScore = () => {
  const { includeLowScore, setIncludeLowScore } = usePreferencesStore();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ includeLowScore }: { includeLowScore: boolean }) =>
      hono.preferences.update({ includeLowScore }),
    onError: errorToast,
    onSuccess: (data) => {
      setIncludeLowScore(data.includeLowScore);
      toast.success("Notification preference updated");
    }
  });

  return (
    <div className="m-5">
      <ToggleWithHelper
        description="Turn on low-signal notification filter"
        disabled={isPending}
        heading="Notification Signal filter"
        icon={<SwatchIcon className="size-5" />}
        on={includeLowScore}
        setOn={() => mutate({ includeLowScore: !includeLowScore })}
      />
    </div>
  );
};

export default IncludeLowScore;
