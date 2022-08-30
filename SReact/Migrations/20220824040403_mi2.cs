using Microsoft.EntityFrameworkCore.Migrations;

namespace SReact.Migrations
{
    public partial class mi2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_ChatGroups_ChatGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_ChatGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ChatGroupId",
                table: "AspNetUsers");

            migrationBuilder.CreateTable(
                name: "Member_ChatGroup",
                columns: table => new
                {
                    MemberId = table.Column<string>(nullable: false),
                    ChatGroupId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Member_ChatGroup", x => new { x.MemberId, x.ChatGroupId });
                    table.ForeignKey(
                        name: "FK_Member_ChatGroup_ChatGroups_ChatGroupId",
                        column: x => x.ChatGroupId,
                        principalTable: "ChatGroups",
                        principalColumn: "ChatGroupId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Member_ChatGroup_AspNetUsers_MemberId",
                        column: x => x.MemberId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Member_ChatGroup_ChatGroupId",
                table: "Member_ChatGroup",
                column: "ChatGroupId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Member_ChatGroup");

            migrationBuilder.AddColumn<int>(
                name: "ChatGroupId",
                table: "AspNetUsers",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_ChatGroupId",
                table: "AspNetUsers",
                column: "ChatGroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_ChatGroups_ChatGroupId",
                table: "AspNetUsers",
                column: "ChatGroupId",
                principalTable: "ChatGroups",
                principalColumn: "ChatGroupId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
