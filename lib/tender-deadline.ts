export function getDeadlineStatus(
  deadline: Date
) {

  const today = new Date();


  const deadlineDate = new Date(deadline);


  // Remove time difference issues
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);



  const difference =
    deadlineDate.getTime()
    -
    today.getTime();



  const days =
    Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );




  /*
  ========================================
  CLOSED
  ========================================
  */

  if (days <= 0) {

    return {

      status: "critical",

      text: "Closed",

      color: "text-red-600",

    };

  }





  /*
  ========================================
  CRITICAL
  1 DAY LEFT
  ========================================
  */

  if (days === 1) {

    return {

      status: "critical",

      text: "Closes tomorrow",

      color: "text-red-600",

    };

  }







  /*
  ========================================
  WARNING
  2 - 5 DAYS LEFT
  ========================================
  */

  if (days <= 5) {

    return {

      status: "warning",

      text: `Closing in ${days} days`,

      color: "text-orange-500",

    };

  }







  /*
  ========================================
  NORMAL
  MORE THAN 5 DAYS
  ========================================
  */

  return {

    status: "normal",

    text: `${days} days remaining`,

    color: "text-green-600",

  };


}