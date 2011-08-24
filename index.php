<?php

$user_type = $_GET['u'];
$title = "";
$user = "";
$user_css = "";
$user_script = "";

switch ($user_type)
{
	case 'moderator':
		$user = "moderator";
		$title = "Video Chat With The Panelists - Moderator View";
	break;
	case 'panelist':
		$user = "panelist";
		$title = "Video Chat With The Panelists - Panelist View";
	break;
	default:
		$user = "audience";
		$title = "Video Chat With The Panelists";
}

$user_css = "css/".$user.".css";
$view = "html/".$user.".html";
$user_script = "js/".$user.".js";

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="description" content="Live video stream to talk with a band" />
<meta name="keywords" content="OpenTok TokBox Music Bands Connect Fans" />
<meta name="author" content="Ezra Velazquez" />
<!--
 _____     _    ______                 _ 
|_   _|   | |   | ___ \               | |
  | | ___ | | __| |_/ /__ _ _ __   ___| |
  | |/ _ \| |/ /|  __// _` | '_ \ / _ \ |
  | | (_) |   ( | |  | (_| | | | |  __/ |
  \_/\___/|_|\_\\_|   \__,_|_| |_|\___|_|
                                                            
-->
<title><?php echo $title; ?></title>
<link type="text/css" href="<?php echo $user_css; ?>" rel="stylesheet" />
<script type="text/javascript" src="js/jquery-1.5.1.min.js"></script>
<script src="http://static.opentok.com/v0.91/js/TB.min.js" type="text/javascript" charset="utf-8"></script>
<script src="<?php echo $user_script; ?>" type="text/javascript"></script>
</head>
<body>
	<?php include($view);?>
</body>