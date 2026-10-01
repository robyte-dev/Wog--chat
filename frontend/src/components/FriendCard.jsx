import { Link } from "react-router";
import AvatarDisplay from "./AvatarDisplay";
import LanguageFlag from "./LanguageFlag";
import { useLanguage } from "../features/language/useLanguage";

const FriendCard = ({ friend }) => {
  const { t } = useLanguage();
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12 overflow-hidden rounded-full">
            <AvatarDisplay src={friend.profilePic} alt={friend.fullName || "Friend"} size={48} className="object-cover" />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            <LanguageFlag language={friend.nativeLanguage} />
            {t("friends.native")}: {friend.nativeLanguage}
          </span>
        </div>

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          {t("friends.message")}
        </Link>
      </div>
    </div>
  );
};
export default FriendCard;
