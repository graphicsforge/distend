
function User()
{
  this.signedIn = false;
  this.password = undefined;
}

User.prototype.init = function(user)
{
  this.signedIn = true;
  this.username = user.username;
  this.img = user.img;
}
