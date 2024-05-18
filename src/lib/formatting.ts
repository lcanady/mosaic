import { parser } from "./parser";

export const center = (str: string, len: number, filler = " ") => {
  // get the length of the string, and the length of the start and end padding
  const strLen = parser.stripSubs("telnet", str).length;
  const str2 = parser.stripSubs("telnet", str);

  // padLen needs to take in the length

  const padLen = len - strLen;
  const padStart = Math.ceil(padLen / 2);
  const padEnd = padLen - padStart;

  // return the padded string
  return `${filler.repeat(padStart)}${str}${filler.repeat(padEnd)}`;
};

export const ljust = (str: string, len: number, filler = " ", elip = false) => {
  const strLen = parser.stripSubs("telnet", str).length;
  // if the string is longer than cut the string off with elipses
  if (strLen > len && elip) {
    return str.slice(0, len - 3) + "...%cn";
  } else if (strLen > len) {
    return str.slice(0, len);
  }

  return `${str}${filler.repeat(len - strLen)}`;
};

export const rjust = (str: string, len: number, filler = " ") => {
  const strLen = parser.stripSubs("telnet", str).length;
  // if the string is longer than cut the string off with elipses
  if (strLen > len) {
    return str.slice(0, len - 3) + "...%cn";
  }

  return `${filler.repeat(len - strLen)}${str}`;
};

export const formatTime = (idleSeconds: number) => {
  // Convert the input seconds to the time elapsed since that timestamp
  const seconds = Math.floor((Date.now() / 1000) - idleSeconds);

  // Calculate days, hours, minutes, and seconds
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;

  if (secs < 0) secs = 0;

  // Construct the time string from largest to smallest unit
  let time = "";

  if (!time) {
    time = "0s";
  }

  if (secs) {
    time = `${secs}s`;
  }

  if (minutes) {
    time = `${minutes}m`;
  }

  if (hours) {
    time = `${hours}h`;
  }

  if (days) {
    time = `${days}d`;
  }
  time = time.trim(); // Remove any trailing space
  // Colorize the time based on the idle duration in curSecs
  if (seconds < 120) {
    return `%ch%cg${time}%cn`; // Bright green for less than 2 minutes
  } else if (seconds < 300) {
    return `%cg${time}%cn`; // Green for less than 5 minutes
  } else if (seconds < 600) {
    return `%ch%cy${time}%cn`; // Yellow for less than 10 minutes
  } else if( seconds < 1200) {
    return `%cy${time}%cn`; // Dark yellow for less than 20 minutes
  } else if (seconds < 1800) {
    return `%ch%cr${time}%cn`; // Red for less than 30 minutes
  } else if (seconds < 3600) {
    return `%cr${time}%cn`; // Dark red for more than 30 minutes 
  } else {
    return `%ch%cx${time}%cn`; // No color for more than 1 hour
  }

};


export const capString = (str: string) => {
  // Capitalize the first letter of every word in a string, and lowercase the rest.
  return str.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

export const columnize = (arr: string[], cols: number) => {
  // Calculate the number of rows needed to display the array in the specified number of columns
  
  const width = 78 / cols;
  let output = "";

  // Loop through the array and add each element to the output string
  for (let i = 0; i < arr.length; i++) {
    output += ljust(arr[i], width);
    // If the current column is the last column in the row, add a newline
    if ((i + 1) % cols === 0) {
      output += "\n";
    }
  }

  return output;
}