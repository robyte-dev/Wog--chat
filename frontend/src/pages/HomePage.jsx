import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CompassIcon,
  Globe2Icon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { capitialize } from "../lib/utils";
import useAuthUser from "../hooks/useAuthUser";
import AvatarDisplay from "../components/AvatarDisplay";
import FriendCard from "../components/FriendCard";
import LanguageFlag from "../components/LanguageFlag";
import NoFriendsFound from "../components/NoFriendsFound";
import { useLanguage } from "../features/language/useLanguage";

const HomePage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const { t } = useLanguage();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending, variables: pendingUserId } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    setOutgoingRequestsIds(
      new Set(outgoingFriendReqs.map((req) => req.recipient?._id).filter(Boolean)),
    );
  }, [outgoingFriendReqs]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recommendedUsers;
    return recommendedUsers.filter((user) =>
      [user.fullName, user.location, user.nativeLanguage, user.learningLanguage, user.bio]
        .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [recommendedUsers, search]);

  const firstName = authUser?.fullName?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="home-dashboard">
      <div className="home-dashboard-inner">
        <section className="home-welcome-card">
          <div className="home-welcome-copy">
            <span className="home-eyebrow"><SparklesIcon /> {t("home.eyebrow")}</span>
            <h1>{t("home.welcome", { name: firstName })}</h1>
            <p>{t("home.welcomeDescription")}</p>
            <div className="home-welcome-actions">
              <a className="home-primary-action" href="#discover-learners">
                {t("home.findPartner")} <ArrowRightIcon />
              </a>
              <Link className="home-secondary-action" to="/notifications">
                <UsersIcon /> {t("home.friendRequests")}
              </Link>
            </div>
          </div>
          <div className="home-welcome-art" aria-hidden="true">
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <span className="home-art-bubble home-art-bubble-one">Hola!</span>
            <span className="home-art-bubble home-art-bubble-two">ሰላም</span>
            <div className="home-globe"><Globe2Icon /></div>
            <span className="home-art-spark home-art-spark-one">✦</span>
            <span className="home-art-spark home-art-spark-two">✧</span>
          </div>
        </section>

        <section className="home-overview" aria-label="Your community at a glance">
          <div className="home-stat-card">
            <span className="home-stat-icon home-stat-cyan"><UsersIcon /></span>
            <div><strong>{loadingFriends ? "—" : friends.length}</strong><span>{t("home.connections")}</span></div>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon home-stat-violet"><CompassIcon /></span>
            <div><strong>{loadingUsers ? "—" : recommendedUsers.length}</strong><span>{t("home.learnersToMeet")}</span></div>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon home-stat-pink"><SparklesIcon /></span>
            <div><strong>{outgoingRequestsIds.size}</strong><span>{t("home.requestsWaiting")}</span></div>
          </div>
        </section>

        <section className="home-section home-friends-section">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">{t("home.yourCircle")}</span>
              <h2>{t("home.partners")}</h2>
              <p>{t("home.resumeConversations")}</p>
            </div>
            <Link to="/friends" className="home-text-link">{t("home.viewFriends")} <ArrowRightIcon /></Link>
          </div>

          {loadingFriends ? (
            <div className="home-loading"><span className="loading loading-spinner loading-md" /></div>
          ) : friends.length === 0 ? (
            <div className="home-empty-friends"><NoFriendsFound /></div>
          ) : (
            <div className="home-friends-grid">
              {friends.map((friend) => <FriendCard key={friend._id} friend={friend} />)}
            </div>
          )}
        </section>

        <section className="home-section home-discover-section" id="discover-learners">
          <div className="home-section-heading home-discover-heading">
            <div>
              <span className="home-section-kicker">{t("home.growCircle")}</span>
              <h2>{t("home.meetLearners")}</h2>
              <p>{t("home.readyToShare")}</p>
            </div>
            <label className="home-search">
              <SearchIcon aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("home.search")}
                aria-label={t("home.searchLabel")}
              />
            </label>
          </div>

          {loadingUsers ? (
            <div className="home-loading"><span className="loading loading-spinner loading-md" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="home-no-learners">
              <span className="home-empty-icon"><SearchIcon /></span>
              <h3>{search ? t("home.noMatch") : t("home.noLearners")}</h3>
              <p>{search ? t("home.tryAnother") : t("home.checkBack")}</p>
            </div>
          ) : (
            <div className="home-learners-grid">
              {filteredUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                const isThisRequestPending = isPending && pendingUserId === user._id;

                return (
                  <article key={user._id} className="learner-card">
                    <div className="learner-card-topline">
                      <span className="learner-open-badge"><span /> {t("home.openToConnect")}</span>
                      <span className="learner-card-spark"><SparklesIcon /></span>
                    </div>
                    <div className="learner-identity">
                      <div className="learner-avatar-wrap">
                        <AvatarDisplay
                          src={user.profilePic}
                          alt={user.fullName || "Language learner"}
                          size={72}
                          className="learner-avatar-image"
                        />
                      </div>
                      <div className="learner-name-wrap">
                        <h3>{user.fullName || "Language learner"}</h3>
                        {user.location && <span className="learner-location"><MapPinIcon /> {user.location}</span>}
                      </div>
                    </div>
                    <div className="learner-language-list">
                      {user.nativeLanguage && (
                        <span className="learner-language learner-language-native">
                          <LanguageFlag language={user.nativeLanguage} /><span><small>{t("home.speaks")}</small>{capitialize(user.nativeLanguage)}</span>
                        </span>
                      )}
                      {user.learningLanguage && (
                        <span className="learner-language learner-language-learning">
                          <LanguageFlag language={user.learningLanguage} /><span><small>{t("home.learning")}</small>{capitialize(user.learningLanguage)}</span>
                        </span>
                      )}
                    </div>
                    <p className="learner-bio">{user.bio || t("home.defaultBio")}</p>
                    <button
                      className={`learner-connect-button ${hasRequestBeenSent ? "is-sent" : ""}`}
                      onClick={() => sendRequestMutation(user._id)}
                      disabled={hasRequestBeenSent || isPending}
                    >
                      {hasRequestBeenSent ? <><CheckCircle2Icon /> {t("home.requestSent")}</> : <><UserPlusIcon /> {isThisRequestPending ? t("home.sending") : t("home.connect")}</>}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
