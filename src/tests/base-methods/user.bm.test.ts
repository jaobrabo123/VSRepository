import { createId } from "@paralleldrive/cuid2"
import userRepository from "../../repositories/user.repository"

async function test() {
    const mockId = createId();

    const resultGroupBy = await userRepository.groupBy({
        by: "id",
        take: 10
    }, {})
    console.log(resultGroupBy)

    const resultCountWhere = await userRepository.countWhere({
        email: "123"
    })
    console.log(resultCountWhere)

    // await userRepository.deleteManyBy();

    const saveUserWithId = await userRepository.save({
        id: mockId,
        email: 'user@email.com',
        name: 'user',
        userType: "COMMON"
    });
    console.log("User saved with id:", saveUserWithId);

    const getUser = await userRepository.rawById(mockId);
    console.log('Get user:', getUser);

    console.log("Removed user:", await userRepository.remove(mockId));

    const userSavedWithouId = await userRepository.save({
        name: 'john',
        email: 'john@email.com',
        userType: "COMMON"
    });
    console.log('User saved without id:', userSavedWithouId);

    console.log('User withou id removed:', await userRepository.remove(userSavedWithouId.id));

    const commonUser = await userRepository.save({
        email: 'new@email.com',
        name: 'new user',
        userType: "COMMON",
        commonUser: {
            id: createId(),
            birthDate: new Date('2000-12-10'),
            image: 'url.com/imagem'
        }
    }, {selectModel: 'commonUser'});


    console.log("Common user:", commonUser)

    commonUser.commonUser.biography = 'hello guys';
    commonUser.name = "Peter"

    const commonUserUpdated = await userRepository.save(commonUser, {selectModel: 'commonUser'});

    console.log("Common user updated:", commonUserUpdated)


    await userRepository.remove(commonUser.id)

    process.exit(0);
}
test()