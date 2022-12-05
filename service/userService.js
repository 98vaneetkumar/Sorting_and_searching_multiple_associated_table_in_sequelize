const Model = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
exports.addUser = (data) => {
  return Model.userModel.create(data);
};

exports.getuser = (data) => {
  return Model.userModel.findAll();
};

Model.userModel.hasMany(Model.gameModel, {
  as: "gameModel",
  foreignKey: "userID",
});

Model.gameModel.hasMany(Model.groundModel, { foreignKey: "gameID",as:"groundModel" });
Model.groundModel.hasMany(Model.locationModel, { foreignKey: "groundID", as:"locationModel"});

exports.getuserall = (criteria, limit, offset) => {
  return new Promise((resolve, reject) => {
    let where = {};
    console.log(criteria, "cccccc");
let projection=Sequelize.literal(`(select * from user order by firstName '%${criteria.orderBy}%' )`);

let order = [
  ["userId","ASC"],["gameModel","groundModel","groundName","DESC"]
]
    if (criteria.sortBy && criteria.orderBy) {
      order = [[criteria.sortBy, criteria.orderBy]];
    }
    console.log(order, "oooooooooooooooooo");
    if (criteria && criteria.search) {
      where = {
        [Op.or]: {
          userId: {
            [Op.or]: {
              [Op.in]: Sequelize.literal(
                `(  Select userID from game where gamename LIKE '%${criteria.search}%' OR gameLevel LIKE '%${criteria.search}% '
                UNION ALL
                 select distinct game.userID from game inner join ground on game.gameId=
                       ( select ground.gameId from ground inner join
                       location on ground.groundId=location.groundID where locationName LIKE '%${criteria.search}%')
                UNION ALL
                Select userID from game as game INNER JOIN ground as ground ON game.gameId=ground.gameID where   groundName LIKE '%${criteria.search}%' 
                UNION ALL
                SELECT userId FROM user WHERE (CONCAT(firstName, ' ', lastName)) LIKE '%${criteria.search}%')`
              ),
            },
          },
        },
      };
    }
    console.log(where, "cccccc");
    Model.userModel
      .findAll({
        limit,
        offset,
        where: where,
        include: [
          {
            model: Model.gameModel,
            as: "gameModel",
            include: [
              {
                model: Model.groundModel,
                as:"groundModel",
                include: [
                  {
                    model: Model.locationModel,
                    as:"locationModel"
                  },
                ],
              },
            ],
          },
        ],
        order: order,
      })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

/*

order = [[Sequelize.literal((SELECT sum("final_amount") from "donations" WHERE
 "donations"."typeId" = "fundraising"."id" and "donations"."type" = '4') ${criteria.sortby})]];
order = [[createUser,country, ${criteria.sortby}],];

                */

// order=[[Sequelize.literal(`(select * from user order by firstName '%${criteria.sortBy}%' )`)]]
      // order=[[`user,game,ground,location,${criteria.sortBy}`]]
      // order=[
      //   userId={
      //     [Op.or]:{
      //       [Op.in]:Sequelize.literal(`(select * from user order by firstName '%${criteria.orderBy}%' )`)
      //     }
      // }]