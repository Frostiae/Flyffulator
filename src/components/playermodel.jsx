import { useEffect } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';

function PlayerModel() {
    const { scene, animations } = useGLTF("/model/vagrant.glb");
    const { actions, mixer } = useAnimations(animations, scene);
    useEffect(() => {
        if (actions) {
            const action = actions[Object.keys(actions)[0]];
            if (action) {
                action.play();
            }
        }

        return () => {
            if (mixer) {
                mixer.stopAllAction();
            }
        };
    }, [actions, mixer]);

    return (
        <primitive object={scene} />
    )
}

export default PlayerModel;
