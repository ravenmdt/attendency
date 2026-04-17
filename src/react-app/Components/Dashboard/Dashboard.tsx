import { useAuth } from "../Auth/AuthContext";

/*
  Dashboard.tsx

  This is the top-level dashboard screen shown after login.
  Its job is to assemble the smaller dashboard sections into one readable page.

  The dashboard is also the default landing view inside the app shell, so users
  arrive here first and can return here anytime from the navigation menu.
*/

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8">
      {/*
        Welcome section:
        This gives the user immediate context about where they are and what the
        dashboard is meant to help them do.
      */}

      <div className="bg-white py-24 sm:py-32 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="mt-2 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
              {currentUser ? `Welcome ${currentUser.name}` : "Welcome"}
            </h2>
            <p className="mt-8 text-xl font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
              <p className="ui-text-muted mt-2">
                You can use this tool to pass your attendance data efficiently
                to ops. For now it is recommended to use this app via a desktop
                internet browser.
              </p>
              <p className="ui-text-muted mt-2">
                A quick tour, in the navigation menu you can find:{" "}
              </p>
              <ul className="ui-text-muted mt-2 ml-4 list-disc">
                <li>
                  <span className="ui-text-muted">
                    Team, which lists all the current accounts and their
                    qualifications, and allows Admins to manage account
                    permissions.
                  </span>
                </li>
                <li>
                  <span className="ui-text-muted">
                    Calendar, which allows you to mark your availability for
                    each day and wave.
                  </span>
                </li>
                <li>
                  <span className="ui-text-muted">
                    Reports, which shows the attendance data that has been saved
                    for each day.
                  </span>
                </li>
                <li>
                  <span className="ui-text-muted">
                    You have a profile button, there you can manage your own
                    qualification comfort level such that our planners can keep
                    that in mind to the maximum extent the schedule allows.
                    Change your password or manage your profile picture.
                  </span>
                </li>
              </ul>
              <p className="mt-8 text-xl font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
                Features to follow include:
                <ul className="ui-text-muted mt-2 ml-4 list-disc">
                  <li>Feedback section</li>
                  <li>
                    A single "Specials" text box in your profile section for
                    each user such that on the reports OPS can view in the
                    reports section. You can update the text at any time to keep
                    it up to date as required.
                  </li>
                  <li>Improved layout</li>
                  <li>
                    Improved mobile support such that calendar works properly on
                    small screens
                  </li>
                  <li>
                    Add a jaarplan to calendar data link such that on the
                    calendar all users can see if the weeks ahead are
                    nightflying weeks, have a higher priority due to
                    understaffing of SQN SIM operators or are ACT/PTT weeks.
                  </li>
                </ul>
              </p>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
